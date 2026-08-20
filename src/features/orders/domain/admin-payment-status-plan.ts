import type { PaymentStatus } from "@/features/orders/domain/payment-status";

export type AdminPaymentStatusPlan =
  | { type: "arca_refund" }
  | { type: "unsupported_provider_refund"; provider: string }
  | { type: "local" };

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
