import {
  formatAppIsoDate,
  appDayStartUtc,
} from "@/lib/datetime/app-timezone";
import {
  analyticsPeriodUtcBounds,
  formatAnalyticsMonthLabel,
  formatAnalyticsShortDate,
  type AnalyticsDateRange,
} from "@/features/analytics/domain/date-range";
import { countAnalyticsRangeDays } from "@/features/analytics/domain/dashboard-periods";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

/** Sparse daily coin flow from the loyalty ledger (net of reversals). */
export type CoinDailyRow = {
  date: string;
  netSpent: number;
  netEarned: number;
};

/** Continuous chart point — daily or monthly depending on range length. */
export type CoinTrendPoint = {
  key: string;
  label: string;
  netSpent: number;
  netEarned: number;
};

export type CoinFlowInput = {
  grossSpent: number;
  spendReversed: number;
  grossEarned: number;
  earnReversed: number;
  /** Users whose net spend in the window is &gt; 0. */
  spenderCount: number;
  /** Sum of per-user net spend for those spenders only. */
  positiveSpent: number;
};

export type CoinFlow = {
  netSpent: number;
  netEarned: number;
  averageSpend: number | null;
};

const COIN_DAILY_SERIES_MAX_DAYS = 45;

function shiftAppDays(date: Date, deltaDays: number): Date {
  return new Date(date.getTime() + deltaDays * 24 * 60 * 60 * 1000);
}

function shiftAppMonths(isoDate: string, deltaMonths: number): string {
  const [year, month] = isoDate.split("-").map(Number) as [number, number];
  const totalMonths = year * 12 + (month - 1) + deltaMonths;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

function monthKeyFromIso(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function listDayKeys(from: string, to: string): string[] {
  const keys: string[] = [];
  let cursor = appDayStartUtc(from);
  const end = appDayStartUtc(to);
  while (cursor.getTime() <= end.getTime()) {
    keys.push(formatAppIsoDate(cursor));
    cursor = shiftAppDays(cursor, 1);
  }
  return keys;
}

function listMonthKeys(from: string, to: string): string[] {
  const keys: string[] = [];
  let cursor = monthKeyFromIso(from);
  const end = monthKeyFromIso(to);
  while (cursor <= end) {
    keys.push(cursor);
    cursor = monthKeyFromIso(shiftAppMonths(`${cursor}-01`, 1));
  }
  return keys;
}

/** Nets reversals out of gross spend/earn and derives average spend. */
export function deriveCoinFlow(input: CoinFlowInput): CoinFlow {
  const netSpent = Math.max(0, input.grossSpent - input.spendReversed);
  const netEarned = Math.max(0, input.grossEarned - input.earnReversed);
  const averageSpend =
    input.spenderCount > 0
      ? Math.round(input.positiveSpent / input.spenderCount)
      : null;

  return { netSpent, netEarned, averageSpend };
}

/** Spent ÷ earned as a percent; null when nothing was earned. */
export function coinRedemptionRatePercent(input: {
  netSpent: number;
  netEarned: number;
}): number | null {
  if (input.netEarned <= 0) {
    return null;
  }
  return Math.round((input.netSpent / input.netEarned) * 1000) / 10;
}

/** Coins added to circulation in the window (earned minus spent). */
export function coinNetIssued(input: {
  netSpent: number;
  netEarned: number;
}): number {
  return input.netEarned - input.netSpent;
}

/**
 * Inclusive UTC window of equal length immediately before `from`/`to`
 * (app-timezone calendar bounds).
 */
export function previousEqualWindow(range: AnalyticsDateRange): {
  start: Date;
  end: Date;
} {
  const { start, end } = analyticsPeriodUtcBounds(range.from, range.to);
  const durationMs = Math.max(
    end.getTime() - start.getTime(),
    24 * 60 * 60 * 1000 - 1,
  );
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);
  return { start: previousStart, end: previousEnd };
}

function buildCoinDailySeries(
  rows: CoinDailyRow[],
  range: AnalyticsDateRange,
  locale: Locale,
): CoinTrendPoint[] {
  const byDate = new Map<string, { netSpent: number; netEarned: number }>();
  for (const row of rows) {
    byDate.set(row.date, {
      netSpent: row.netSpent,
      netEarned: row.netEarned,
    });
  }

  return listDayKeys(range.from, range.to).map((key) => {
    const totals = byDate.get(key) ?? { netSpent: 0, netEarned: 0 };
    return {
      key,
      label: formatAnalyticsShortDate(key, locale),
      netSpent: totals.netSpent,
      netEarned: totals.netEarned,
    };
  });
}

function buildCoinMonthlySeries(
  rows: CoinDailyRow[],
  range: AnalyticsDateRange,
  locale: Locale,
): CoinTrendPoint[] {
  const totals = new Map<string, { netSpent: number; netEarned: number }>();
  for (const row of rows) {
    const key = monthKeyFromIso(row.date);
    const current = totals.get(key) ?? { netSpent: 0, netEarned: 0 };
    current.netSpent += row.netSpent;
    current.netEarned += row.netEarned;
    totals.set(key, current);
  }

  return listMonthKeys(range.from, range.to).map((key) => {
    const monthTotals = totals.get(key) ?? { netSpent: 0, netEarned: 0 };
    return {
      key,
      label: formatAnalyticsMonthLabel(key, locale),
      netSpent: monthTotals.netSpent,
      netEarned: monthTotals.netEarned,
    };
  });
}

/**
 * Continuous coin trend series. Daily for short ranges; calendar months when
 * the inclusive range exceeds 45 days.
 */
export function buildCoinTrendSeries(
  rows: CoinDailyRow[],
  range: AnalyticsDateRange,
  locale: Locale = defaultLocale,
): CoinTrendPoint[] {
  if (countAnalyticsRangeDays(range) > COIN_DAILY_SERIES_MAX_DAYS) {
    return buildCoinMonthlySeries(rows, range, locale);
  }
  return buildCoinDailySeries(rows, range, locale);
}

/** Formats a whole coin amount for admin tables and cards. */
export function formatCoinAmount(amount: number, locale: Locale): string {
  const safe = Number.isFinite(amount) ? Math.trunc(amount) : 0;
  return safe.toLocaleString(locale === "en" ? "en-US" : "ru-RU");
}
