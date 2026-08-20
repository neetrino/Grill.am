import type { ArcaNormalizedState } from "@/lib/payments/arca/types";

export type ArcaFullRefundDecision =
  | { action: "mark_refunded" }
  | { action: "reverse_then_refund" }
  | { action: "reject" };

/**
 * One-stage full refund: apply local REFUNDED if the bank already
 * reversed/refunded; otherwise reverse, then refund if reverse is invalid.
 */
export function decideArcaFullRefund(
  localState: ArcaNormalizedState,
): ArcaFullRefundDecision {
  if (localState === "refunded" || localState === "reversed") {
    return { action: "mark_refunded" };
  }
  if (localState === "captured") {
    return { action: "reverse_then_refund" };
  }
  return { action: "reject" };
}

/** Official error 7: reverse is not valid for the current gateway state. */
export function isArcaReverseUnavailable(providerErrorCode: string): boolean {
  return providerErrorCode === "7";
}
