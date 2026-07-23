import { describe, expect, it } from "vitest";

import {
  formatCouponOffer,
  formatCouponSavings,
} from "@/features/promotions/domain/format-coupon-offer";

describe("formatCouponOffer", () => {
  it("formats percentage offers", () => {
    expect(formatCouponOffer("PERCENTAGE", 15, "AMD", "en")).toBe("15%");
  });

  it("formats fixed AMD offers for hy", () => {
    expect(formatCouponOffer("FIXED", 1000, "AMD", "hy")).toMatch(/1[\u00A0 ]000/);
    expect(formatCouponOffer("FIXED", 1000, "AMD", "hy")).toContain("֏");
  });

  it("returns em dash when incomplete", () => {
    expect(formatCouponOffer(null, null, "AMD", "en")).toBe("—");
    expect(formatCouponOffer("PERCENTAGE", null, "AMD", "en")).toBe("—");
  });
});

describe("formatCouponSavings", () => {
  it("formats savings in AMD", () => {
    expect(formatCouponSavings(500, "AMD", "en")).toContain("500");
  });
});
