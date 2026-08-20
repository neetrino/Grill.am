import { describe, expect, it } from "vitest";

import { isPaymentRetryBlockedByRefund } from "@/features/payments/domain/refund-retry-barrier";

describe("isPaymentRetryBlockedByRefund", () => {
  it("blocks retry after a refunded payment", () => {
    expect(isPaymentRetryBlockedByRefund("REFUNDED", "REFUNDED")).toBe(true);
    expect(isPaymentRetryBlockedByRefund("REFUNDED", "CAPTURED")).toBe(true);
    expect(isPaymentRetryBlockedByRefund("PENDING", "REFUNDED")).toBe(true);
  });

  it("allows retry for unpaid attempts", () => {
    expect(isPaymentRetryBlockedByRefund("PENDING", "FAILED")).toBe(false);
    expect(isPaymentRetryBlockedByRefund("FAILED", null)).toBe(false);
  });
});
