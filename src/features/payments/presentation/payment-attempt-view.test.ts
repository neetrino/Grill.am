import { describe, expect, it } from "vitest";

import {
  FORBIDDEN_CUSTOMER_PAYMENT_FIELDS,
  toAdminPaymentAttemptViews,
  toCustomerPaymentAttemptViews,
  type PaymentAttemptRow,
} from "@/features/payments/presentation/payment-attempt-view";

const row: PaymentAttemptRow = {
  id: "pay-1",
  provider: "arca",
  method: "arca",
  status: "FAILED",
  attemptNumber: 1,
  amount: 1900,
  currency: "AMD",
  providerReference: "ABCDEF123456",
  providerOrderNumber: "ORD-1-1",
  createdAt: new Date("2026-08-01T10:00:00.000Z"),
  authorizedAt: null,
  capturedAt: null,
  failedAt: new Date("2026-08-01T10:05:00.000Z"),
  cancelledAt: null,
  expiresAt: null,
  metadata: { lastVerifiedAt: "2026-08-01T10:04:00.000Z" },
};

describe("payment attempt view models", () => {
  it("exposes only safe customer fields", () => {
    const views = toCustomerPaymentAttemptViews([row], {
      customerStatusByPaymentId: { "pay-1": "failed" },
      retryEligiblePaymentId: "pay-1",
      recheckEligiblePaymentId: null,
    });
    const view = views[0];
    expect(view).toBeDefined();
    if (!view) return;
    expect(view.providerReferenceSuffix).toBe("123456");
    for (const field of FORBIDDEN_CUSTOMER_PAYMENT_FIELDS) {
      expect(view).not.toHaveProperty(field);
    }
    expect(JSON.stringify(view)).not.toContain("ABCDEF123456");
  });

  it("includes operator-safe admin fields without full provider reference", () => {
    const views = toAdminPaymentAttemptViews([row], {
      sourceCartId: "cart-1",
      reviewReason: null,
    });
    const view = views[0];
    expect(view).toBeDefined();
    if (!view) return;
    expect(view.providerOrderNumber).toBe("ORD-1-1");
    expect(view.providerReferenceSuffix).toBe("123456");
    expect(view.lastVerifiedAt).toBe("2026-08-01T10:04:00.000Z");
    expect(JSON.stringify(view)).not.toContain("ABCDEF123456");
  });
});
