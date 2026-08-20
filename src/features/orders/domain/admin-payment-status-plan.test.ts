import { describe, expect, it } from "vitest";

import { planAdminPaymentStatusChange } from "@/features/orders/domain/admin-payment-status-plan";

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
