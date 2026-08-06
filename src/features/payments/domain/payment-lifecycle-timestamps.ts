import type { PaymentStatus } from "@/features/orders/domain/payment-status";

/**
 * Lifecycle timestamp patches for payment status transitions.
 * Never clears an already-set timestamp on replay.
 */
export function paymentLifecycleTimestampPatch(
  toStatus: PaymentStatus,
  now: Date,
  existing: {
    authorizedAt?: Date | null;
    capturedAt?: Date | null;
    failedAt?: Date | null;
    cancelledAt?: Date | null;
    refundedAt?: Date | null;
  },
): Partial<{
  authorizedAt: Date;
  capturedAt: Date;
  failedAt: Date;
  cancelledAt: Date;
  refundedAt: Date;
}> {
  switch (toStatus) {
    case "AUTHORIZED":
      return existing.authorizedAt ? {} : { authorizedAt: now };
    case "CAPTURED":
      return existing.capturedAt ? {} : { capturedAt: now };
    case "FAILED":
      return existing.failedAt ? {} : { failedAt: now };
    case "CANCELLED":
      return existing.cancelledAt ? {} : { cancelledAt: now };
    case "REFUNDED":
      return existing.refundedAt ? {} : { refundedAt: now };
    case "PENDING":
      return {};
    default: {
      const _exhaustive: never = toStatus;
      void _exhaustive;
      return {};
    }
  }
}
