import { describe, expect, it } from "vitest";

import { formatShortDate } from "@/lib/i18n/format-date";

describe("formatShortDate", () => {
  const sample = new Date(Date.UTC(2026, 7, 4));

  it("formats English without Intl", () => {
    expect(formatShortDate(sample, "en")).toBe("Aug 4, 2026");
  });

  it("formats Russian without Intl", () => {
    expect(formatShortDate(sample, "ru")).toBe("4 авг. 2026 г.");
  });

  it("formats Armenian without Intl (hydration-stable)", () => {
    expect(formatShortDate(sample, "hy")).toBe("4 օգս, 2026 թ.");
  });

  it("accepts ISO strings", () => {
    expect(formatShortDate("2026-08-04T12:00:00.000Z", "en")).toBe(
      "Aug 4, 2026",
    );
  });

  it("matches across local timezones near UTC midnight", () => {
    // 2026-08-03 22:00 UTC → still Aug 3 in UTC (would be Aug 4 in UTC+4).
    expect(formatShortDate("2026-08-03T22:00:00.000Z", "en")).toBe(
      "Aug 3, 2026",
    );
  });
});
