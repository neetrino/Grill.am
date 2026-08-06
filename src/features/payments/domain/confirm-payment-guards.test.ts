import { describe, expect, it } from "vitest";

import {
  assertConfirmPaymentAmounts,
} from "@/features/payments/domain/confirm-payment-guards";
import { fingerprintCartItems } from "@/features/payments/domain/cart-fingerprint";
import {
  PaymentAmountMismatchError,
  PaymentCurrencyMismatchError,
} from "@/features/payments/domain/errors";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";

describe("confirm payment guards", () => {
  const base = {
    verifiedAmount: 5000,
    verifiedCurrency: "AMD",
    paymentAmount: 5000,
    paymentCurrency: "AMD",
    orderTotalAmount: 5000,
    orderCurrency: "AMD",
  };

  it("accepts matching amount and currency", () => {
    expect(() => assertConfirmPaymentAmounts(base)).not.toThrow();
  });

  it("rejects wrong amount", () => {
    expect(() =>
      assertConfirmPaymentAmounts({ ...base, verifiedAmount: 4999 }),
    ).toThrow(PaymentAmountMismatchError);
  });

  it("rejects wrong currency", () => {
    expect(() =>
      assertConfirmPaymentAmounts({ ...base, verifiedCurrency: "USD" }),
    ).toThrow(PaymentCurrencyMismatchError);
  });

  it("rejects amount that does not match order total", () => {
    expect(() =>
      assertConfirmPaymentAmounts({ ...base, orderTotalAmount: 6000 }),
    ).toThrow(PaymentAmountMismatchError);
  });
});

describe("fingerprintCartItems", () => {
  it("is order-independent and stable", () => {
    const a = fingerprintCartItems([
      { productId: "b", quantity: 1 },
      { productId: "a", quantity: 2 },
    ]);
    const b = fingerprintCartItems([
      { productId: "a", quantity: 2 },
      { productId: "b", quantity: 1 },
    ]);
    expect(a).toBe(b);
  });

  it("changes when cart contents change", () => {
    const original = fingerprintCartItems([{ productId: "a", quantity: 1 }]);
    const changed = fingerprintCartItems([{ productId: "a", quantity: 2 }]);
    expect(original).not.toBe(changed);
  });
});

describe("safe payment event payload", () => {
  it("stores only safe metadata fields", () => {
    const payload = buildSafePaymentEventPayload({
      kind: "PAYMENT_CAPTURED",
      provider: "arca",
      paymentId: "pay-1",
      attemptNumber: 1,
      providerReference: "ref-1",
      status: "CAPTURED",
      verifiedAmount: 1000,
      verifiedCurrency: "AMD",
    });

    expect(payload).toEqual({
      kind: "PAYMENT_CAPTURED",
      provider: "arca",
      paymentId: "pay-1",
      attemptNumber: 1,
      providerReference: "ref-1",
      status: "CAPTURED",
      verifiedAmount: 1000,
      verifiedCurrency: "AMD",
    });
    expect(payload).not.toHaveProperty("cardNumber");
    expect(payload).not.toHaveProperty("secret");
  });
});
