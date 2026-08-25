import { describe, expect, it } from "vitest";

import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import {
  buildAnalyticsDailySeries,
  buildAnalyticsTrendSeries,
  buildDashboardMonthlySeries,
  countAnalyticsRangeDays,
  parseDashboardChartRange,
  rangeForDashboardChartRange,
  rangeForDashboardMetricPeriod,
} from "@/features/analytics/domain/dashboard-periods";
import { appDayStartUtc } from "@/lib/datetime/app-timezone";

describe("rangeForDashboardMetricPeriod", () => {
  it("returns a single-day window for today", () => {
    const range = rangeForDashboardMetricPeriod("today");
    expect(range.from).toBe(range.to);
  });

  it("returns an inclusive 7-day window for week", () => {
    const range = rangeForDashboardMetricPeriod("week");
    const start = appDayStartUtc(range.from);
    const end = appDayStartUtc(range.to);
    const days =
      Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    expect(days).toBe(7);
  });

  it("starts month range on the first calendar day", () => {
    const range = rangeForDashboardMetricPeriod("month");
    expect(range.from.endsWith("-01")).toBe(true);
    expect(range.from <= range.to).toBe(true);
  });

  it("starts quarter on the first day of the calendar quarter", () => {
    const range = rangeForDashboardMetricPeriod("quarter");
    const month = Number(range.from.slice(5, 7));
    expect([1, 4, 7, 10]).toContain(month);
    expect(range.from.endsWith("-01")).toBe(true);
    expect(range.from <= range.to).toBe(true);
  });
});

describe("rangeForDashboardChartRange", () => {
  it("covers six calendar months including the current month", () => {
    const range = rangeForDashboardChartRange("months_6");
    const series = buildDashboardMonthlySeries([], range);
    expect(series).toHaveLength(6);
  });

  it("covers twelve calendar months including the current month", () => {
    const range = rangeForDashboardChartRange("year");
    const series = buildDashboardMonthlySeries([], range);
    expect(series).toHaveLength(12);
  });
});

describe("buildDashboardMonthlySeries", () => {
  it("aggregates daily rows and fills empty months", () => {
    const rows: AnalyticsCsvRow[] = [
      {
        date: "2026-01-05",
        orderCount: 2,
        revenueAmount: 100,
        averageOrderValue: 50,
      },
      {
        date: "2026-01-20",
        orderCount: 1,
        revenueAmount: 40,
        averageOrderValue: 40,
      },
      {
        date: "2026-03-01",
        orderCount: 4,
        revenueAmount: 200,
        averageOrderValue: 50,
      },
    ];

    const series = buildDashboardMonthlySeries(
      rows,
      {
        from: "2026-01-01",
        to: "2026-03-31",
      },
      "en",
    );

    expect(series).toEqual([
      {
        key: "2026-01",
        label: "January 26",
        orderCount: 3,
        revenueAmount: 140,
      },
      {
        key: "2026-02",
        label: "February 26",
        orderCount: 0,
        revenueAmount: 0,
      },
      {
        key: "2026-03",
        label: "March 26",
        orderCount: 4,
        revenueAmount: 200,
      },
    ]);
  });
});

describe("buildAnalyticsDailySeries", () => {
  it("fills missing days with zero totals", () => {
    const rows: AnalyticsCsvRow[] = [
      {
        date: "2026-01-02",
        orderCount: 2,
        revenueAmount: 100,
        averageOrderValue: 50,
      },
    ];

    const series = buildAnalyticsDailySeries(rows, {
      from: "2026-01-01",
      to: "2026-01-03",
    });

    expect(series).toHaveLength(3);
    expect(series[0]?.orderCount).toBe(0);
    expect(series[1]?.orderCount).toBe(2);
    expect(series[2]?.orderCount).toBe(0);
  });
});

describe("buildAnalyticsTrendSeries", () => {
  it("uses daily points for ranges up to 45 days", () => {
    const range = { from: "2026-01-01", to: "2026-01-07" };
    expect(countAnalyticsRangeDays(range)).toBe(7);
    const series = buildAnalyticsTrendSeries([], range);
    expect(series).toHaveLength(7);
    expect(series[0]?.key).toBe("2026-01-01");
  });

  it("aggregates monthly when the range exceeds 45 days", () => {
    const range = { from: "2026-01-01", to: "2026-03-15" };
    expect(countAnalyticsRangeDays(range)).toBeGreaterThan(45);
    const series = buildAnalyticsTrendSeries([], range);
    expect(series).toHaveLength(3);
    expect(series[0]?.key).toBe("2026-01");
  });
});

describe("parseDashboardChartRange", () => {
  it("falls back to months_6", () => {
    expect(parseDashboardChartRange(undefined)).toBe("months_6");
    expect(parseDashboardChartRange("nope")).toBe("months_6");
    expect(parseDashboardChartRange("year")).toBe("year");
  });
});
