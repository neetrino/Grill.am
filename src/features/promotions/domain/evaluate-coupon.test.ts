import { describe, expect, it } from "vitest";

import {
  couponDiscountErrorMessage,
  evaluateCouponDiscount,
  isCouponUserAllowed,
  type CouponDiscountInput,
} from "@/features/promotions/domain/evaluate-coupon";

function coupon(
  overrides: Partial<CouponDiscountInput> = {},
): CouponDiscountInput {
  return {
    isActive: true,
    startsAt: null,
    endsAt: null,
    minimumOrderAmount: null,
    totalUsageLimit: null,
    usedCount: 0,
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscountAmount: null,
    ...overrides,
  };
}

describe("evaluateCouponDiscount", () => {
  const now = new Date("2026-07-20T12:00:00.000Z");

  it("rejects missing or inactive coupons", () => {
    expect(evaluateCouponDiscount(null, 10_000, now)).toEqual({
      ok: false,
      error: "INVALID_OR_INACTIVE",
    });
    expect(
      evaluateCouponDiscount(coupon({ isActive: false }), 10_000, now),
    ).toEqual({ ok: false, error: "INVALID_OR_INACTIVE" });
  });

  it("rejects not-yet-active and expired coupons", () => {
    expect(
      evaluateCouponDiscount(
        coupon({ startsAt: new Date("2026-07-21T00:00:00.000Z") }),
        10_000,
        now,
      ),
    ).toEqual({ ok: false, error: "NOT_YET_ACTIVE" });

    expect(
      evaluateCouponDiscount(
        coupon({ endsAt: new Date("2026-07-19T00:00:00.000Z") }),
        10_000,
        now,
      ),
    ).toEqual({ ok: false, error: "EXPIRED" });
  });

  it("rejects minimum and usage limit violations", () => {
    expect(
      evaluateCouponDiscount(
        coupon({ minimumOrderAmount: 20_000 }),
        10_000,
        now,
      ),
    ).toEqual({ ok: false, error: "MINIMUM_NOT_MET" });

    expect(
      evaluateCouponDiscount(
        coupon({ totalUsageLimit: 5, usedCount: 5 }),
        10_000,
        now,
      ),
    ).toEqual({ ok: false, error: "USAGE_LIMIT" });
  });

  it("computes percentage and fixed discounts", () => {
    expect(
      evaluateCouponDiscount(
        coupon({ discountType: "PERCENTAGE", discountValue: 10 }),
        10_000,
        now,
      ),
    ).toEqual({ ok: true, discountAmount: 1_000 });

    expect(
      evaluateCouponDiscount(
        coupon({
          discountType: "FIXED",
          discountValue: 2_500,
          maxDiscountAmount: null,
        }),
        10_000,
        now,
      ),
    ).toEqual({ ok: true, discountAmount: 2_500 });
  });

  it("maps error codes to messages", () => {
    expect(couponDiscountErrorMessage("EXPIRED")).toBe("Coupon has expired.");
    expect(couponDiscountErrorMessage("USER_NOT_ELIGIBLE")).toBe(
      "This coupon is not available for your account.",
    );
  });
});

describe("isCouponUserAllowed", () => {
  it("allows everyone when allowlist is empty", () => {
    expect(isCouponUserAllowed([], null)).toBe(true);
    expect(isCouponUserAllowed([], "user-1")).toBe(true);
  });

  it("requires a matching signed-in user when restricted", () => {
    expect(isCouponUserAllowed(["user-1"], null)).toBe(false);
    expect(isCouponUserAllowed(["user-1"], "user-2")).toBe(false);
    expect(isCouponUserAllowed(["user-1", "user-2"], "user-2")).toBe(true);
  });
});
