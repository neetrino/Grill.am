import { describe, expect, it } from "vitest";

import {
  applyEarnMinOrderGate,
  clampBonusSpendAmount,
  computeBonusEarnAmount,
  computeFlatBonusEarnAmount,
  computeMaxBonusRedeemAmount,
  computeOrderTotalWithBonus,
  computeProductBonusEarnAmount,
  computeProductCardBonusEarnAmount,
  isProductBonusRuleActive,
  merchandiseNetAmount,
  pickFlatBonusAmount,
} from "@/features/loyalty/domain/loyalty-math";

describe("loyalty-math", () => {
  it("computes merchandise net after coupon", () => {
    expect(merchandiseNetAmount(10_000, 1_000)).toBe(9_000);
    expect(merchandiseNetAmount(1_000, 2_000)).toBe(0);
  });

  it("computes earn from percentage", () => {
    expect(computeBonusEarnAmount(10_000, 5)).toBe(500);
    expect(computeBonusEarnAmount(999, 5)).toBe(49);
    expect(computeBonusEarnAmount(10_000, 0)).toBe(0);
  });

  it("caps redeem by balance and payable total only", () => {
    expect(
      computeMaxBonusRedeemAmount({
        merchandiseNet: 10_000,
        deliveryAmount: 500,
        balanceAmount: 50_000,
      }),
    ).toBe(10_500);

    expect(
      computeMaxBonusRedeemAmount({
        merchandiseNet: 10_000,
        deliveryAmount: 500,
        balanceAmount: 800,
      }),
    ).toBe(800);

    expect(
      computeMaxBonusRedeemAmount({
        merchandiseNet: 1_000,
        deliveryAmount: 0,
        balanceAmount: 5_000,
      }),
    ).toBe(1_000);

    // No merchandise floor for spend — small carts can still redeem.
    expect(
      computeMaxBonusRedeemAmount({
        merchandiseNet: 1_500,
        deliveryAmount: 0,
        balanceAmount: 5_000,
      }),
    ).toBe(1_500);
  });

  it("gates earn by admin min order", () => {
    expect(applyEarnMinOrderGate(90, 1_500, 2_000)).toBe(0);
    expect(applyEarnMinOrderGate(90, 2_000, 2_000)).toBe(90);
    expect(applyEarnMinOrderGate(90, 500, null)).toBe(90);
    expect(applyEarnMinOrderGate(0, 5_000, 2_000)).toBe(0);
  });

  it("computes product-card earn preview", () => {
    expect(
      computeProductCardBonusEarnAmount({
        priceAmount: 10_000,
        earnPercent: 1,
        flatBonusAmount: 45,
      }),
    ).toBe(145);
    expect(
      computeProductCardBonusEarnAmount({
        priceAmount: 999,
        earnPercent: 5,
        flatBonusAmount: null,
      }),
    ).toBe(49);
  });

  it("clamps requested spend", () => {
    expect(clampBonusSpendAmount(3_000, 2_000)).toBe(2_000);
    expect(clampBonusSpendAmount(undefined, 2_000)).toBe(0);
    expect(clampBonusSpendAmount(-1, 2_000)).toBe(0);
  });

  it("computes payable total", () => {
    expect(
      computeOrderTotalWithBonus({
        merchandiseNet: 10_000,
        deliveryAmount: 500,
        bonusSpentAmount: 2_000,
      }),
    ).toBe(8_500);
  });

  it("evaluates product bonus windows", () => {
    const now = new Date("2026-09-11T12:00:00.000Z");
    expect(
      isProductBonusRuleActive({ startsAt: null, endsAt: null }, now),
    ).toBe(true);
    expect(
      isProductBonusRuleActive(
        {
          startsAt: new Date("2026-09-12T00:00:00.000Z"),
          endsAt: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isProductBonusRuleActive(
        {
          startsAt: new Date("2026-09-01T00:00:00.000Z"),
          endsAt: new Date("2026-09-30T23:59:59.999Z"),
        },
        now,
      ),
    ).toBe(true);
  });

  it("computes flat product bonus earn × quantity", () => {
    const now = new Date("2026-09-11T12:00:00.000Z");
    const rules = new Map([
      [
        "p1",
        {
          amount: 45,
          startsAt: null as Date | null,
          endsAt: null as Date | null,
        },
      ],
      [
        "p2",
        {
          amount: 100,
          startsAt: new Date("2026-10-01T00:00:00.000Z"),
          endsAt: null as Date | null,
        },
      ],
    ]);
    expect(
      computeProductBonusEarnAmount(
        [
          { productId: "p1", quantity: 2 },
          { productId: "p2", quantity: 1 },
          { productId: "p3", quantity: 5 },
        ],
        rules,
        now,
      ),
    ).toBe(90);
  });

  it("picks product over best category flat bonus", () => {
    expect(
      pickFlatBonusAmount({
        productAmount: 45,
        categoryAmounts: [10, 80],
      }),
    ).toBe(45);
    expect(
      pickFlatBonusAmount({
        productAmount: null,
        categoryAmounts: [10, 80],
      }),
    ).toBe(80);
    expect(
      pickFlatBonusAmount({
        productAmount: null,
        categoryAmounts: [null, 0],
      }),
    ).toBe(null);
  });

  it("computes earn from resolved flat amounts", () => {
    expect(
      computeFlatBonusEarnAmount(
        [
          { productId: "p1", quantity: 2 },
          { productId: "p2", quantity: 1 },
        ],
        new Map([
          ["p1", 45],
          ["p2", 10],
        ]),
      ),
    ).toBe(100);
  });
});
