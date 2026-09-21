import {
  canTransitionPaymentStatus,
  type PaymentStatus,
} from "@/features/orders/domain/payment-status";

export type AdminPaymentStatusPlan =
  | { type: "arca_refund" }
  | { type: "unsupported_provider_refund"; provider: string }
  | { type: "local" };

/**
 * Paid cash has no bank capture, so Cancelled is a local status change.
 * Card and wallet captures must be returned with Refunded.
 */
export function allowsCapturedToCancelled(provider: string | null): boolean {
  return provider === "cod";
}

/**
 * Choosing Refunded on a captured ARCA row must hit the bank.
 * iDram refund stays out of the shop. COD and other methods stay local.
 */
export function planAdminPaymentStatusChange(input: {
  toStatus: PaymentStatus;
  provider: string | null;
}): AdminPaymentStatusPlan {
  if (input.toStatus !== "REFUNDED") {
    return { type: "local" };
  }

  if (input.provider === "arca") {
    return { type: "arca_refund" };
  }

  if (input.provider === "idram") {
    return { type: "unsupported_provider_refund", provider: "idram" };
  }

  return { type: "local" };
}

/** Cash Paid ↔ Cancelled stays local. Captured card funds must use Refunded. */
export function assertAdminPaymentTransition(input: {
  fromStatus: PaymentStatus;
  toStatus: PaymentStatus;
  provider: string | null;
}): void {
  if (isCashPaidCancelMove(input)) {
    return;
  }

  if (input.fromStatus === "CAPTURED" && input.toStatus === "CANCELLED") {
    throw new Error("CAPTURED_USE_REFUND");
  }

  if (!canTransitionPaymentStatus(input.fromStatus, input.toStatus)) {
    throw new Error("INVALID_TRANSITION");
  }
}

function isCashPaidCancelMove(input: {
  fromStatus: PaymentStatus;
  toStatus: PaymentStatus;
  provider: string | null;
}): boolean {
  if (!allowsCapturedToCancelled(input.provider)) {
    return false;
  }

  const paidToCancelled =
    input.fromStatus === "CAPTURED" && input.toStatus === "CANCELLED";
  const cancelledToPaid =
    input.fromStatus === "CANCELLED" && input.toStatus === "CAPTURED";

  return paidToCancelled || cancelledToPaid;
}
