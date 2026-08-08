import { z } from "zod";

import {
  formatAppIsoDate,
  appDayStartUtc,
} from "@/lib/datetime/app-timezone";
import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import {
  formatAnalyticsShortDate,
  type AnalyticsDateRange,
} from "@/features/analytics/domain/date-range";

export const DASHBOARD_METRIC_PERIODS = [
  "today",
  "week",
  "month",
  "quarter",
] as const;
export type DashboardMetricPeriod = (typeof DASHBOARD_METRIC_PERIODS)[number];

export const DASHBOARD_CHART_RANGES = ["months_6", "year"] as const;
export type DashboardChartRange = (typeof DASHBOARD_CHART_RANGES)[number];

export const dashboardMetricPeriodSchema = z.enum(DASHBOARD_METRIC_PERIODS);
export const dashboardChartRangeSchema = z.enum(DASHBOARD_CHART_RANGES);

export type DashboardTrendPoint = {
  key: string;
  label: string;
  orderCount: number;
  revenueAmount: number;
};

function appToday(): Date {
  return appDayStartUtc(formatAppIsoDate(new Date()));
}

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

function formatMonthLabel(monthKey: string): string {
  return new Date(`${monthKey}-01T12:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
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

function calendarQuarterStart(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number) as [number, number];
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return `${year}-${String(quarterStartMonth).padStart(2, "0")}-01`;
}

/** Inclusive app-timezone range for a dashboard metric period. */
export function rangeForDashboardMetricPeriod(
  period: DashboardMetricPeriod,
): AnalyticsDateRange {
  const toDate = appToday();
  const to = formatAppIsoDate(toDate);

  if (period === "today") {
    return { from: to, to };
  }

  if (period === "week") {
    return { from: formatAppIsoDate(shiftAppDays(toDate, -6)), to };
  }

  if (period === "quarter") {
    return { from: calendarQuarterStart(to), to };
  }

  const [year, month] = to.split("-").map(Number) as [number, number];
  return {
    from: `${year}-${String(month).padStart(2, "0")}-01`,
    to,
  };
}

/** Inclusive app-timezone range for the dashboard trend chart. */
export function rangeForDashboardChartRange(
  range: DashboardChartRange,
): AnalyticsDateRange {
  const to = formatAppIsoDate(appToday());
  const monthsBack = range === "months_6" ? 5 : 11;
  return {
    from: shiftAppMonths(to, -monthsBack),
    to,
  };
}

/** Parses dashboard chart range from a query value. */
export function parseDashboardChartRange(
  value: string | undefined,
): DashboardChartRange {
  const parsed = dashboardChartRangeSchema.safeParse(value);
  return parsed.success ? parsed.data : "months_6";
}

/**
 * Builds a continuous monthly series for the dashboard trend chart.
 * Sparse daily rows are summed into calendar months; empty months stay at zero.
 */
const ANALYTICS_DAILY_SERIES_MAX_DAYS = 45;

/** Inclusive day count for an analytics date range. */
export function countAnalyticsRangeDays(range: AnalyticsDateRange): number {
  const start = appDayStartUtc(range.from);
  const end = appDayStartUtc(range.to);
  return (
    Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
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

/**
 * Builds a continuous daily series for analytics trend charts.
 * Sparse rows are mapped to calendar days; missing days stay at zero.
 */
export function buildAnalyticsDailySeries(
  rows: AnalyticsCsvRow[],
  range: AnalyticsDateRange,
): DashboardTrendPoint[] {
  const byDate = new Map<
    string,
    { orderCount: number; revenueAmount: number }
  >();

  for (const row of rows) {
    byDate.set(row.date, {
      orderCount: row.orderCount,
      revenueAmount: row.revenueAmount,
    });
  }

  return listDayKeys(range.from, range.to).map((key) => {
    const totalsForDay = byDate.get(key) ?? {
      orderCount: 0,
      revenueAmount: 0,
    };
    return {
      key,
      label: formatAnalyticsShortDate(key),
      orderCount: totalsForDay.orderCount,
      revenueAmount: Math.round(totalsForDay.revenueAmount * 100) / 100,
    };
  });
}

/**
 * Daily points for short ranges; monthly aggregation when the range exceeds 45 days.
 */
export function buildAnalyticsTrendSeries(
  rows: AnalyticsCsvRow[],
  range: AnalyticsDateRange,
): DashboardTrendPoint[] {
  if (countAnalyticsRangeDays(range) > ANALYTICS_DAILY_SERIES_MAX_DAYS) {
    return buildDashboardMonthlySeries(rows, range);
  }
  return buildAnalyticsDailySeries(rows, range);
}

export function buildDashboardMonthlySeries(
  rows: AnalyticsCsvRow[],
  range: AnalyticsDateRange,
): DashboardTrendPoint[] {
  const totals = new Map<
    string,
    { orderCount: number; revenueAmount: number }
  >();

  for (const row of rows) {
    const key = monthKeyFromIso(row.date);
    const current = totals.get(key) ?? { orderCount: 0, revenueAmount: 0 };
    current.orderCount += row.orderCount;
    current.revenueAmount += row.revenueAmount;
    totals.set(key, current);
  }

  return listMonthKeys(range.from, range.to).map((key) => {
    const totalsForMonth = totals.get(key) ?? {
      orderCount: 0,
      revenueAmount: 0,
    };
    return {
      key,
      label: formatMonthLabel(key),
      orderCount: totalsForMonth.orderCount,
      revenueAmount: Math.round(totalsForMonth.revenueAmount * 100) / 100,
    };
  });
}
