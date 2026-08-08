import { z } from "zod";

import {
  formatAppIsoDate,
  appDayEndUtc,
  appDayStartUtc,
} from "@/lib/datetime/app-timezone";

const MAX_RANGE_DAYS = 366;

export const ANALYTICS_PERIOD_PRESETS = [
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_month",
  "custom",
] as const;

export type AnalyticsPeriodPreset = (typeof ANALYTICS_PERIOD_PRESETS)[number];

export const analyticsPeriodPresetSchema = z.enum(ANALYTICS_PERIOD_PRESETS);

export const analyticsDateRangeSchema = z
  .object({
    from: z.string().date(),
    to: z.string().date(),
  })
  .refine((value) => value.from <= value.to, {
    message: "from must be on or before to",
  })
  .refine(
    (value) => {
      const start = appDayStartUtc(value.from);
      const end = appDayStartUtc(value.to);
      const days =
        Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) +
        1;
      return days <= MAX_RANGE_DAYS;
    },
    { message: `Date range must be at most ${MAX_RANGE_DAYS} days` },
  );

export type AnalyticsDateRange = z.infer<typeof analyticsDateRangeSchema>;

function appToday(): Date {
  const iso = formatAppIsoDate(new Date());
  return appDayStartUtc(iso);
}

function shiftAppDays(date: Date, deltaDays: number): Date {
  return new Date(date.getTime() + deltaDays * 24 * 60 * 60 * 1000);
}

/** Inclusive app-timezone (UTC+4) date range for a named analytics period preset. */
export function rangeForAnalyticsPeriod(
  preset: Exclude<AnalyticsPeriodPreset, "custom">,
): AnalyticsDateRange {
  const toDate = appToday();
  let fromDate = toDate;

  if (preset === "last_7_days") {
    fromDate = shiftAppDays(toDate, -6);
  } else if (preset === "last_30_days") {
    fromDate = shiftAppDays(toDate, -29);
  } else if (preset === "last_90_days") {
    fromDate = shiftAppDays(toDate, -89);
  } else {
    const iso = formatAppIsoDate(toDate);
    const [year, month] = iso.split("-").map(Number) as [number, number];
    fromDate = appDayStartUtc(
      `${year}-${String(month).padStart(2, "0")}-01`,
    );
  }

  return { from: formatAppIsoDate(fromDate), to: formatAppIsoDate(toDate) };
}

/** Default inclusive last-30-days range in app-timezone ISO dates. */
export function defaultAnalyticsDateRange(): AnalyticsDateRange {
  return rangeForAnalyticsPeriod("last_30_days");
}

/** Detects which preset matches an inclusive from/to range. */
export function matchAnalyticsPeriodPreset(
  range: AnalyticsDateRange,
): AnalyticsPeriodPreset {
  for (const preset of [
    "last_7_days",
    "last_30_days",
    "last_90_days",
    "this_month",
  ] as const) {
    const expected = rangeForAnalyticsPeriod(preset);
    if (expected.from === range.from && expected.to === range.to) {
      return preset;
    }
  }
  return "custom";
}

/** Formats an ISO date for analytics headers (e.g. Jul 12, 2026). */
export function formatAnalyticsDisplayDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Formats a short chart/list date (e.g. Jul 13). */
export function formatAnalyticsShortDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00.000Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Formats percent delta vs a previous numeric value. */
export function formatPeriodDelta(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "+100%" : "—";
  }
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** Inclusive UTC instants for an app-timezone calendar from/to range. */
export function analyticsPeriodUtcBounds(
  from: string,
  to: string,
): { start: Date; end: Date } {
  return {
    start: appDayStartUtc(from),
    end: appDayEndUtc(to),
  };
}
