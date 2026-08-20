import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type PaymentRefundErrors = AdminDictionary["orders"]["paymentRefundErrors"];

/** Staff-visible payment-status errors; unknown codes keep the action fallback. */
export function resolveAdminPaymentStatusError(
  copy: PaymentRefundErrors,
  code: string,
  fallback: string,
): string {
  switch (code) {
    case "ARCA_ACCESS_DENIED":
      return copy.accessDenied;
    case "ARCA_REFUND_INVALID_STATE":
      return copy.invalidState;
    case "ARCA_ORDER_NOT_FOUND":
      return copy.orderNotFound;
    case "PAYMENT_REFUND_NOT_ALLOWED":
      return copy.notAllowed;
    case "PAYMENT_REFUND_UNCONFIRMED":
      return copy.unconfirmed;
    case "PAYMENT_REFUND_IN_PROGRESS":
      return copy.inProgress;
    case "PAYMENT_AMOUNT_MISMATCH":
      return copy.amountMismatch;
    case "TOO_MANY_REQUESTS":
      return copy.rateLimited;
    case "PAYMENT_REFUND_FAILED":
      return copy.generic;
    default:
      return fallback;
  }
}
