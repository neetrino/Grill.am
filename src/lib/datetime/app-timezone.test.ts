import { describe, expect, it } from "vitest";

import {
  appDayEndUtc,
  appDayStartUtc,
  formatAppDateTimeLocalInput,
  formatAppDateTimeMinutes,
  formatAppDisplayDate,
  formatAppDotDate,
  formatAppIsoDate,
  formatAppTimeMinutes,
  parseAppDateTimeLocal,
  toAppZonedParts,
} from "@/lib/datetime/app-timezone";

describe("app timezone (UTC+4)", () => {
  it("shifts calendar day across UTC midnight", () => {
    // 2026-08-03 22:00 UTC → 2026-08-04 02:00 UTC+4
    const parts = toAppZonedParts("2026-08-03T22:00:00.000Z");
    expect(parts).toMatchObject({
      year: 2026,
      monthIndex: 7,
      day: 4,
      hour: 2,
      minute: 0,
    });
    expect(formatAppIsoDate("2026-08-03T22:00:00.000Z")).toBe("2026-08-04");
    expect(formatAppDisplayDate("2026-08-03T22:00:00.000Z")).toBe("04/08/2026");
    expect(formatAppDotDate("2026-08-03T22:00:00.000Z")).toBe("04.08.2026");
    expect(formatAppTimeMinutes("2026-08-03T22:00:00.000Z")).toBe("02:00");
    expect(formatAppDateTimeMinutes("2026-08-03T22:00:00.000Z")).toBe(
      "04/08/2026 02:00",
    );
  });

  it("round-trips datetime-local wall clock", () => {
    const parsed = parseAppDateTimeLocal("2026-08-04T02:00");
    expect(parsed.toISOString()).toBe("2026-08-03T22:00:00.000Z");
    expect(formatAppDateTimeLocalInput(parsed)).toBe("2026-08-04T02:00");
  });

  it("builds inclusive app-day UTC bounds", () => {
    expect(appDayStartUtc("2026-08-04").toISOString()).toBe(
      "2026-08-03T20:00:00.000Z",
    );
    expect(appDayEndUtc("2026-08-04").toISOString()).toBe(
      "2026-08-04T19:59:59.999Z",
    );
  });
});
