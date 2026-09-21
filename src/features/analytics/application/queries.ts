import "server-only";

import {
  and,
  count,
  eq,
  gte,
  lte,
  sql,
} from "drizzle-orm";

import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { orders, users } from "@/db/schema";
import {
  queryTopCategories,
  queryTopSellingProducts,
  type AnalyticsTopCategory,
  type AnalyticsTopProduct,
} from "@/features/analytics/application/top-rankings";
import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import { analyticsPeriodUtcBounds } from "@/features/analytics/domain/date-range";
import { sumIncludedRevenueSql } from "@/features/analytics/application/revenue-amount-sql";
import { formatAppIsoDate } from "@/lib/datetime/app-timezone";
import type { Locale } from "@/lib/i18n/config";
import { logger } from "@/lib/observability/logger";

export type {
  AnalyticsTopCategory,
  AnalyticsTopProduct,
} from "@/features/analytics/application/top-rankings";
export type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
export { buildAnalyticsCsv, guardCsvCell } from "@/features/analytics/domain/csv";

const CACHE_TTL_SECONDS = 300;
const REV_TTL_SECONDS = 60 * 60 * 24;
const REV_KEY = "analytics:rev";
const cacheKeys = new Set<string>();

export type AnalyticsSummary = {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  orderCount: number;
  revenueAmount: number;
  averageOrderValue: number;
  userCount: number;
  previousOrderCount: number;
  previousRevenueAmount: number;
  previousAverageOrderValue: number;
  dailyRows: AnalyticsCsvRow[];
  topProducts: AnalyticsTopProduct[];
  topCategories: AnalyticsTopCategory[];
};

function periodBounds(from: string, to: string): {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  previousFrom: string;
  previousTo: string;
} {
  const { start, end } = analyticsPeriodUtcBounds(from, to);
  const durationMs = Math.max(
    end.getTime() - start.getTime(),
    24 * 60 * 60 * 1000 - 1,
  );
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return {
    start,
    end,
    previousStart,
    previousEnd,
    previousFrom: formatAppIsoDate(previousStart),
    previousTo: formatAppIsoDate(previousEnd),
  };
}

function averageOrderValue(revenue: number, orderCount: number): number {
  if (orderCount === 0) {
    return 0;
  }
  return Math.round((revenue / orderCount) * 100) / 100;
}

function cacheKey(
  revision: string,
  from: string,
  to: string,
  locale: Locale,
): string {
  return `analytics:${revision}:${locale}:${from}:${to}`;
}

async function queryPeriodMetrics(input: {
  start: Date;
  end: Date;
}): Promise<{ orderCount: number; revenueAmount: number }> {
  const where = and(
    eq(orders.isArchived, false),
    gte(orders.placedAt, input.start),
    lte(orders.placedAt, input.end),
  );

  const [[ordersRow], [revenueRow]] = await Promise.all([
    getDb().select({ value: count() }).from(orders).where(where),
    getDb()
      .select({
        value: sumIncludedRevenueSql({
          amount: orders.totalAmount,
          orderStatus: orders.status,
        }),
      })
      .from(orders)
      .where(where),
  ]);

  return {
    orderCount: ordersRow?.value ?? 0,
    revenueAmount: revenueRow?.value ?? 0,
  };
}

async function queryDailyRows(input: {
  from: string;
  to: string;
}): Promise<AnalyticsCsvRow[]> {
  const bounds = periodBounds(input.from, input.to);
  const rows = await getDb()
    .select({
      date: sql<string>`to_char(${orders.placedAt} at time zone 'Asia/Yerevan', 'YYYY-MM-DD')`,
      orderCount: count(),
      revenueAmount: sumIncludedRevenueSql({
        amount: orders.totalAmount,
        orderStatus: orders.status,
      }),
    })
    .from(orders)
    .where(
      and(
        eq(orders.isArchived, false),
        gte(orders.placedAt, bounds.start),
        lte(orders.placedAt, bounds.end),
      ),
    )
    .groupBy(sql`to_char(${orders.placedAt} at time zone 'Asia/Yerevan', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.placedAt} at time zone 'Asia/Yerevan', 'YYYY-MM-DD')`);

  return rows.map((row) => ({
    date: row.date,
    orderCount: row.orderCount,
    revenueAmount: row.revenueAmount,
    averageOrderValue: averageOrderValue(row.revenueAmount, row.orderCount),
  }));
}

async function computeAnalyticsSummary(input: {
  from: string;
  to: string;
  locale: Locale;
}): Promise<AnalyticsSummary> {
  const bounds = periodBounds(input.from, input.to);

  const [current, previous, dailyRows, [usersRow], topProducts, topCategories] =
    await Promise.all([
      queryPeriodMetrics({
        start: bounds.start,
        end: bounds.end,
      }),
      queryPeriodMetrics({
        start: bounds.previousStart,
        end: bounds.previousEnd,
      }),
      queryDailyRows({
        from: input.from,
        to: input.to,
      }),
      getDb().select({ value: count() }).from(users),
      queryTopSellingProducts({
        start: bounds.start,
        end: bounds.end,
      }),
      queryTopCategories({
        start: bounds.start,
        end: bounds.end,
        locale: input.locale,
      }),
    ]);

  return {
    from: input.from,
    to: input.to,
    previousFrom: bounds.previousFrom,
    previousTo: bounds.previousTo,
    orderCount: current.orderCount,
    revenueAmount: current.revenueAmount,
    averageOrderValue: averageOrderValue(
      current.revenueAmount,
      current.orderCount,
    ),
    userCount: usersRow?.value ?? 0,
    previousOrderCount: previous.orderCount,
    previousRevenueAmount: previous.revenueAmount,
    previousAverageOrderValue: averageOrderValue(
      previous.revenueAmount,
      previous.orderCount,
    ),
    dailyRows,
    topProducts,
    topCategories,
  };
}

/** Loads analytics summary with Redis cache (300s TTL). */
export async function getAnalyticsSummary(input: {
  from: string;
  to: string;
  locale?: Locale;
}): Promise<AnalyticsSummary> {
  const locale = input.locale ?? "hy";
  const redis = getProviders().redis.getClient();
  const revision = (await redis.get(REV_KEY)) ?? "0";
  const key = cacheKey(revision, input.from, input.to, locale);
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached) as AnalyticsSummary;
  }

  const summary = await computeAnalyticsSummary({
    from: input.from,
    to: input.to,
    locale,
  });
  await redis.set(key, JSON.stringify(summary), { ex: CACHE_TTL_SECONDS });
  cacheKeys.add(key);
  return summary;
}

/** Drops cached analytics so the next read includes new or updated orders. */
export async function invalidateAnalyticsCache(): Promise<void> {
  try {
    const redis = getProviders().redis.getClient();
    await redis.set(REV_KEY, String(Date.now()), { ex: REV_TTL_SECONDS });
    await Promise.all(
      [...cacheKeys].map(async (key) => {
        await redis.del(key);
        cacheKeys.delete(key);
      }),
    );
  } catch (error) {
    logger.warn("analytics.cache_invalidate_failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
  }
}
