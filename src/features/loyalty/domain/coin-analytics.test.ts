import { describe, expect, it } from "vitest";

import { appDayStartUtc } from "@/lib/datetime/app-timezone";
import {
  buildCoinTrendSeries,
  coinNetIssued,
  coinRedemptionRatePercent,
  deriveCoinFlow,
  previousEqualWindow,
} from "@/features/loyalty/domain/coin-analytics";

describe("deriveCoinFlow", () => {
  it("nets reversals out of spend and earn", () => {
    const flow = deriveCoinFlow({
      grossSpent: 1_000,
      spendReversed: 200,
      grossEarned: 1_500,
      earnReversed: 100,
      spenderCount: 2,
      positiveSpent: 800,
    });

    expect(flow.netSpent).toBe(800);
    expect(flow.netEarned).toBe(1_400);
    expect(flow.averageSpend).toBe(400);
  });

  it("leaves average empty when nobody finished the period with a spend", () => {
    const flow = deriveCoinFlow({
      grossSpent: 100,
      spendReversed: 100,
      grossEarned: 0,
      earnReversed: 0,
      spenderCount: 0,
      positiveSpent: 0,
    });

    expect(flow.netSpent).toBe(0);
    expect(flow.averageSpend).toBeNull();
  });
});

describe("coinRedemptionRatePercent", () => {
  it("returns null when nothing was earned", () => {
    expect(
      coinRedemptionRatePercent({ netSpent: 100, netEarned: 0 }),
    ).toBeNull();
  });

  it("rounds spent over earned to one decimal", () => {
    expect(
      coinRedemptionRatePercent({ netSpent: 1, netEarned: 3 }),
    ).toBe(33.3);
  });
});

describe("coinNetIssued", () => {
  it("is earned minus spent", () => {
    expect(coinNetIssued({ netSpent: 400, netEarned: 1_000 })).toBe(600);
  });
});

describe("previousEqualWindow", () => {
  it("steps back one calendar day for a single-day range", () => {
    const previous = previousEqualWindow({
      from: "2026-09-28",
      to: "2026-09-28",
    });

    expect(previous.end.getTime()).toBe(
      appDayStartUtc("2026-09-28").getTime() - 1,
    );
    expect(previous.start.getTime()).toBe(appDayStartUtc("2026-09-27").getTime());
  });
});

describe("buildCoinTrendSeries", () => {
  it("fills missing days with zero", () => {
    const points = buildCoinTrendSeries(
      [{ date: "2026-09-02", netSpent: 50, netEarned: 20 }],
      { from: "2026-09-01", to: "2026-09-03" },
      "en",
    );

    expect(points.map((point) => point.netSpent)).toEqual([0, 50, 0]);
    expect(points.map((point) => point.key)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("sums a long range into calendar months", () => {
    const points = buildCoinTrendSeries(
      [
        { date: "2026-01-02", netSpent: 10, netEarned: 5 },
        { date: "2026-01-20", netSpent: 15, netEarned: 7 },
        { date: "2026-02-01", netSpent: 4, netEarned: 9 },
      ],
      { from: "2026-01-01", to: "2026-03-01" },
      "en",
    );

    expect(points.map((point) => point.key)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
    expect(points[0]).toMatchObject({ netSpent: 25, netEarned: 12 });
    expect(points[2]).toMatchObject({ netSpent: 0, netEarned: 0 });
  });
});
