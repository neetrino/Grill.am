import { describe, expect, it } from "vitest";

import {
  getPaymentPresentationState,
  resolvePresentationWithUxHint,
} from "@/features/payments/presentation/get-payment-presentation-state";
import type { PaymentPresentationInput } from "@/features/payments/presentation/payment-presentation-state";

function base(
  overrides: Partial<PaymentPresentationInput> = {},
): PaymentPresentationInput {
  return {
    paymentMethod: "arca",
    provider: "arca",
    orderStatus: "PENDING",
    orderPaymentStatus: "PENDING",
    latestAttemptStatus: "PENDING",
    capturedExists: false,
    providerInitialized: true,
    attemptExpired: false,
    providerUnavailable: false,
    ...overrides,
  };
}

describe("getPaymentPresentationState", () => {
  it("maps COD pending without online pending semantics", () => {
    const result = getPaymentPresentationState(
      base({
        paymentMethod: "cash_on_delivery",
        provider: "cod",
        latestAttemptStatus: "PENDING",
        providerInitialized: false,
      }),
    );
    expect(result).toEqual({
      state: "cod_pending",
      retryEligible: false,
      recheckEligible: false,
      isCod: true,
    });
  });

  it("maps captured over stale pending attempt", () => {
    expect(
      getPaymentPresentationState(
        base({
          capturedExists: true,
          orderPaymentStatus: "CAPTURED",
          latestAttemptStatus: "PENDING",
        }),
      ).state,
    ).toBe("captured");
  });

  it("maps requires_review when paid but fulfillment blocked", () => {
    const result = getPaymentPresentationState(
      base({
        capturedExists: true,
        orderPaymentStatus: "CAPTURED",
        orderStatus: "REQUIRES_REVIEW",
      }),
    );
    expect(result.state).toBe("requires_review");
    expect(result.retryEligible).toBe(false);
  });

  it("maps awaiting_provider for initialized pending online attempt", () => {
    expect(getPaymentPresentationState(base()).state).toBe("awaiting_provider");
  });

  it("maps redirect_required when not yet initialized", () => {
    expect(
      getPaymentPresentationState(base({ providerInitialized: false })).state,
    ).toBe("redirect_required");
  });

  it("maps authorized", () => {
    expect(
      getPaymentPresentationState(
        base({
          latestAttemptStatus: "AUTHORIZED",
          orderPaymentStatus: "AUTHORIZED",
        }),
      ).state,
    ).toBe("authorized");
  });

  it("maps failed with retry", () => {
    const result = getPaymentPresentationState(
      base({
        latestAttemptStatus: "FAILED",
        orderPaymentStatus: "FAILED",
      }),
    );
    expect(result.state).toBe("failed");
    expect(result.retryEligible).toBe(true);
  });

  it("maps cancelled with retry", () => {
    const result = getPaymentPresentationState(
      base({
        latestAttemptStatus: "CANCELLED",
        orderPaymentStatus: "CANCELLED",
      }),
    );
    expect(result.state).toBe("cancelled");
    expect(result.retryEligible).toBe(true);
  });

  it("maps expired pending attempt", () => {
    expect(
      getPaymentPresentationState(
        base({ attemptExpired: true, latestAttemptStatus: "PENDING" }),
      ).state,
    ).toBe("expired");
  });

  it("maps refunded", () => {
    expect(
      getPaymentPresentationState(
        base({ orderPaymentStatus: "REFUNDED", latestAttemptStatus: "REFUNDED" }),
      ).state,
    ).toBe("refunded");
  });

  it("maps provider unavailable", () => {
    expect(
      getPaymentPresentationState(base({ providerUnavailable: true })).state,
    ).toBe("unavailable");
  });

  it("ignores UX failed hint when captured", () => {
    const captured = getPaymentPresentationState(
      base({
        capturedExists: true,
        orderPaymentStatus: "CAPTURED",
      }),
    );
    expect(resolvePresentationWithUxHint(captured, "failed").state).toBe(
      "captured",
    );
  });

  it("ignores UX review hint without capture", () => {
    const pending = getPaymentPresentationState(base());
    expect(resolvePresentationWithUxHint(pending, "review").state).toBe(
      "awaiting_provider",
    );
  });

  it("maps iDram COD-like method names safely as online when provider idram", () => {
    expect(
      getPaymentPresentationState(
        base({ paymentMethod: "idram", provider: "idram" }),
      ).state,
    ).toBe("awaiting_provider");
  });
});
