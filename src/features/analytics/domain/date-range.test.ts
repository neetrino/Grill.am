import { describe, expect, it } from "vitest";

import {
  formatAnalyticsDisplayDate,
  formatAnalyticsMonthShort,
  matchAnalyticsPeriodPreset,
  rangeForAnalyticsPeriod,
} from "@/features/analytics/domain/date-range";
import { appDayStartUtc } from "@/lib/datetime/app-timezone";

describe("rangeForAnalyticsPeriod", () => {
  it("returns an inclusive last-7-days window", () => {
    const range = rangeForAnalyticsPeriod("last_7_days");
    const start = appDayStartUtc(range.from);
    const end = appDayStartUtc(range.to);
    const days =
      Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    expect(days).toBe(7);
    expect(range.from <= range.to).toBe(true);
  });

  it("matches preset detection for generated ranges", () => {
    const range = rangeForAnalyticsPeriod("last_30_days");
    expect(matchAnalyticsPeriodPreset(range)).toBe("last_30_days");
  });
});

describe("formatAnalyticsDisplayDate", () => {
  it("formats English headers", () => {
    expect(formatAnalyticsDisplayDate("2026-07-12", "en")).toBe(
      "July 12, 2026",
    );
  });

  it("formats Armenian headers without Intl fallback", () => {
    expect(formatAnalyticsDisplayDate("2026-07-12", "hy")).toBe(
      "12 Հուլիս, 2026 թ.",
    );
  });

  it("formats Russian headers", () => {
    expect(formatAnalyticsDisplayDate("2026-07-12", "ru")).toBe(
      "12 Июль 2026 г.",
    );
  });
});

describe("formatAnalyticsMonthShort", () => {
  it("returns full month names per locale", () => {
    expect(formatAnalyticsMonthShort("2026-08-01", "hy")).toBe("Օգոստոս");
    expect(formatAnalyticsMonthShort("2026-08-01", "ru")).toBe("Август");
    expect(formatAnalyticsMonthShort("2026-08-01", "en")).toBe("August");
  });
});
