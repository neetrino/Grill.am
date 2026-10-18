import { describe, expect, it } from "vitest";

import {
  allowsCapturedToCancelled,
  assertAdminPaymentTransition,
  planAdminPaymentStatusChange,
} from "@/features/orders/domain/admin-payment-status-plan";

describe("allowsCapturedToCancelled", () => {
  it("allows cash and rejects captured card or wallet funds", () => {
    expect(allowsCapturedToCancelled("cod")).toBe(true);
    expect(allowsCapturedToCancelled("arca")).toBe(false);
    expect(allowsCapturedToCancelled("idram")).toBe(false);
    expect(allowsCapturedToCancelled(null)).toBe(false);
  });
});

describe("assertAdminPaymentTransition", () => {
  it("lets paid cash move to Cancelled", () => {
    expect(() =>
      assertAdminPaymentTransition({
        fromStatus: "CAPTURED",
        toStatus: "CANCELLED",
        provider: "cod",
      }),
    ).not.toThrow();
  });

  it("requires Refunded for a captured card payment", () => {
    expect(() =>
      assertAdminPaymentTransition({
        fromStatus: "CAPTURED",
        toStatus: "CANCELLED",
        provider: "arca",
      }),
    ).toThrow("CAPTURED_USE_REFUND");
  });

  it("lets cancelled cash be marked Paid again", () => {
    expect(() =>
      assertAdminPaymentTransition({
        fromStatus: "CANCELLED",
        toStatus: "CAPTURED",
        provider: "cod",
      }),
    ).not.toThrow();
  });

  it("rejects marking a cancelled card payment Paid", () => {
    expect(() =>
      assertAdminPaymentTransition({
        fromStatus: "CANCELLED",
        toStatus: "CAPTURED",
        provider: "arca",
      }),
    ).toThrow("INVALID_TRANSITION");
  });
});

describe("planAdminPaymentStatusChange", () => {
  it("sends captured ARCA refunds through the bank", () => {
    expect(
      planAdminPaymentStatusChange({ toStatus: "REFUNDED", provider: "arca" }),
    ).toEqual({ type: "arca_refund" });
  });

  it("rejects in-app iDram refunds", () => {
    expect(
      planAdminPaymentStatusChange({ toStatus: "REFUNDED", provider: "idram" }),
    ).toEqual({ type: "unsupported_provider_refund", provider: "idram" });
  });

  it("keeps COD refunds and non-refund statuses local", () => {
    expect(
      planAdminPaymentStatusChange({ toStatus: "REFUNDED", provider: "cod" }),
    ).toEqual({ type: "local" });
    expect(
      planAdminPaymentStatusChange({
        toStatus: "CANCELLED",
        provider: "arca",
      }),
    ).toEqual({ type: "local" });
    expect(
      planAdminPaymentStatusChange({ toStatus: "FAILED", provider: "arca" }),
    ).toEqual({ type: "local" });
  });
});
