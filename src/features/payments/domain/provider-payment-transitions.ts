import type { PaymentStatus } from "@/features/orders/domain/payment-status";

/**
 * Provider-driven payment attempt transitions (callbacks / confirm-payment).
 * Stricter than admin corrections: no downgrade from CAPTURED, no revive of
 * FAILED/CANCELLED on the same attempt (retry creates a new attempt).
 */
const PROVIDER_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: ["CAPTURED", "FAILED", "CANCELLED", "AUTHORIZED"],
  AUTHORIZED: ["CAPTURED", "FAILED", "CANCELLED"],
  CAPTURED: [],
  FAILED: [],
  REFUNDED: [],
  CANCELLED: [],
};

/** Whether a provider callback may move `from → to` on the same attempt. */
export function canProviderTransitionPaymentStatus(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  return PROVIDER_TRANSITIONS[from].includes(to);
}

export function getEligibleProviderPaymentStatuses(
  from: PaymentStatus,
): PaymentStatus[] {
  return [...PROVIDER_TRANSITIONS[from]];
}
