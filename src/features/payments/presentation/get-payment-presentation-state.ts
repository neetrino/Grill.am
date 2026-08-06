import {
  type PaymentPresentationInput,
  type PaymentPresentationResult,
  type PaymentPresentationState,
} from "@/features/payments/presentation/payment-presentation-state";

function isCodMethod(method: string, provider: string | null): boolean {
  const normalizedMethod = method.toLowerCase();
  const normalizedProvider = (provider ?? "").toLowerCase();
  return (
    normalizedMethod === "cash_on_delivery" ||
    normalizedMethod === "cod" ||
    normalizedMethod === "cash" ||
    normalizedProvider === "cod"
  );
}

function isTerminalFailure(status: string | null): boolean {
  return status === "FAILED" || status === "CANCELLED";
}

/**
 * Maps order + payment attempt facts into one presentation state.
 * CAPTURED and REQUIRES_REVIEW always win over stale browser redirect hints.
 */
export function getPaymentPresentationState(
  input: PaymentPresentationInput,
): PaymentPresentationResult {
  const isCod = isCodMethod(input.paymentMethod, input.provider);

  if (input.capturedExists || input.orderPaymentStatus === "CAPTURED") {
    if (input.orderStatus === "REQUIRES_REVIEW") {
      return {
        state: "requires_review",
        retryEligible: false,
        recheckEligible: false,
        isCod: false,
      };
    }
    return {
      state: "captured",
      retryEligible: false,
      recheckEligible: false,
      isCod: false,
    };
  }

  if (input.orderPaymentStatus === "REFUNDED") {
    return {
      state: "refunded",
      retryEligible: false,
      recheckEligible: false,
      isCod,
    };
  }

  if (isCod) {
    return {
      state: "cod_pending",
      retryEligible: false,
      recheckEligible: false,
      isCod: true,
    };
  }

  if (input.providerUnavailable) {
    return {
      state: "unavailable",
      retryEligible: false,
      recheckEligible: false,
      isCod: false,
    };
  }

  const attempt = input.latestAttemptStatus;

  if (attempt === "AUTHORIZED" || input.orderPaymentStatus === "AUTHORIZED") {
    return {
      state: "authorized",
      retryEligible: false,
      recheckEligible: true,
      isCod: false,
    };
  }

  if (attempt === "FAILED" || input.orderPaymentStatus === "FAILED") {
    return {
      state: "failed",
      retryEligible: true,
      recheckEligible: false,
      isCod: false,
    };
  }

  if (attempt === "CANCELLED" || input.orderPaymentStatus === "CANCELLED") {
    const expired =
      input.attemptExpired ||
      // Local expiry often lands as CANCELLED via failPayment.
      Boolean(input.attemptExpired);
    return {
      state: expired && attempt === "CANCELLED" ? "expired" : "cancelled",
      retryEligible: true,
      recheckEligible: false,
      isCod: false,
    };
  }

  if (input.attemptExpired && (attempt === "PENDING" || attempt === null)) {
    return {
      state: "expired",
      retryEligible: true,
      recheckEligible: false,
      isCod: false,
    };
  }

  if (attempt === "PENDING" || attempt === null) {
    if (!input.providerInitialized) {
      return {
        state: "redirect_required",
        retryEligible: true,
        recheckEligible: true,
        isCod: false,
      };
    }
    return {
      state: "awaiting_provider",
      retryEligible: false,
      recheckEligible: true,
      isCod: false,
    };
  }

  // Unknown attempt status — stay safe, allow recheck only.
  const state: PaymentPresentationState = "processing";
  return {
    state,
    retryEligible: !isTerminalFailure(attempt),
    recheckEligible: true,
    isCod: false,
  };
}

/** Prefer query hint only when it does not contradict CAPTURED / review. */
export function resolvePresentationWithUxHint(
  presentation: PaymentPresentationResult,
  uxHint: string | null | undefined,
): PaymentPresentationResult {
  if (
    presentation.state === "captured" ||
    presentation.state === "requires_review" ||
    presentation.state === "cod_pending" ||
    presentation.state === "refunded"
  ) {
    return presentation;
  }

  if (uxHint === "failed" && presentation.state !== "failed") {
    return {
      ...presentation,
      state: presentation.state === "cancelled" ? "cancelled" : presentation.state,
    };
  }

  if (uxHint === "cancelled" && presentation.retryEligible) {
    return { ...presentation, state: "cancelled" };
  }

  if (uxHint === "review") {
    // Never invent review without CAPTURED — DB already handled above.
    return presentation;
  }

  return presentation;
}
