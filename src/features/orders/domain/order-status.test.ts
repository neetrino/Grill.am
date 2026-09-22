import { describe, expect, it } from "vitest";

import {
  canTransitionOrderStatus,
  getEligibleOrderStatuses,
  shouldRestoreStockOnCancel,
} from "@/features/orders/domain/order-status";

describe("order status transitions", () => {
  it("allows admin list moves among Pending / Processing / Completed / Cancelled", () => {
    expect(canTransitionOrderStatus("PENDING", "PROCESSING")).toBe(true);
    expect(canTransitionOrderStatus("PROCESSING", "DELIVERED")).toBe(true);
    expect(canTransitionOrderStatus("DELIVERED", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("CANCELLED", "PENDING")).toBe(true);
  });

  it("allows cancel before shipment and refund after delivery", () => {
    expect(canTransitionOrderStatus("PENDING", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("PROCESSING", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("DELIVERED", "REFUNDED")).toBe(true);
  });

  it("allows reopen from cancelled", () => {
    expect(getEligibleOrderStatuses("CANCELLED")).toEqual([
      "PENDING",
      "PROCESSING",
      "CONFIRMED",
      "DELIVERED",
    ]);
  });

  it("allows operator moves from REQUIRES_REVIEW", () => {
    expect(canTransitionOrderStatus("REQUIRES_REVIEW", "PROCESSING")).toBe(
      true,
    );
    expect(canTransitionOrderStatus("PENDING", "REQUIRES_REVIEW")).toBe(true);
  });

  it("allows Confirmed like Completed for admin moves", () => {
    expect(canTransitionOrderStatus("PROCESSING", "CONFIRMED")).toBe(true);
    expect(canTransitionOrderStatus("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("DELIVERED", "CONFIRMED")).toBe(true);
  });

  it("restores stock only when cancelling before shipment", () => {
    expect(shouldRestoreStockOnCancel("PENDING")).toBe(true);
    expect(shouldRestoreStockOnCancel("PROCESSING")).toBe(true);
    expect(shouldRestoreStockOnCancel("CONFIRMED")).toBe(false);
    expect(shouldRestoreStockOnCancel("SHIPPED")).toBe(false);
    expect(shouldRestoreStockOnCancel("DELIVERED")).toBe(false);
  });
});
