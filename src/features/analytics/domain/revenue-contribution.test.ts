import { describe, expect, it } from "vitest";

import { orderRevenueContribution } from "@/features/analytics/domain/revenue-contribution";

describe("orderRevenueContribution", () => {
  it("adds every status, including pending", () => {
    for (const orderStatus of [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "REQUIRES_REVIEW",
    ]) {
      expect(
        orderRevenueContribution({
          orderStatus,
          amount: 1000,
        }),
      ).toBe(1000);
    }
  });

  it("excludes cancelled and refunded orders", () => {
    expect(
      orderRevenueContribution({
        orderStatus: "CANCELLED",
        amount: 2000,
      }),
    ).toBe(0);
    expect(
      orderRevenueContribution({
        orderStatus: "REFUNDED",
        amount: 800,
      }),
    ).toBe(0);
  });

  it("drops revenue by the order amount once when cancelled", () => {
    const placed = orderRevenueContribution({
      orderStatus: "PENDING",
      amount: 2000,
    });
    const cancelled = orderRevenueContribution({
      orderStatus: "CANCELLED",
      amount: 2000,
    });

    expect(cancelled - placed).toBe(-2000);
  });
});
