/**
 * Provider-independent payment error classification for logs and operator copy.
 * Customer copy must stay generic; never expose stack traces.
 */

export const PAYMENT_ERROR_CLASSES = [
  "configuration",
  "validation",
  "transport",
  "provider_rejected",
  "authentication",
  "timeout",
  "malformed_response",
  "amount_mismatch",
  "currency_mismatch",
  "reference_mismatch",
  "checksum_invalid",
  "ownership_denied",
  "invalid_transition",
  "stock_unavailable",
  "reconciliation_required",
  "rate_limited",
  "unknown",
] as const;

export type PaymentErrorClass = (typeof PAYMENT_ERROR_CLASSES)[number];

const CODE_TO_CLASS: Record<string, PaymentErrorClass> = {
  PAYMENT_METHOD_DISABLED: "configuration",
  PAYMENT_PROVIDER_NOT_CONFIGURED: "configuration",
  PAYMENT_AMOUNT_MISMATCH: "amount_mismatch",
  PAYMENT_CURRENCY_MISMATCH: "currency_mismatch",
  PAYMENT_ALREADY_CAPTURED: "invalid_transition",
  INVALID_PAYMENT_TRANSITION: "invalid_transition",
  INSUFFICIENT_STOCK_AT_CONFIRMATION: "stock_unavailable",
  PAYMENT_NOT_FOUND: "validation",
  PAYMENT_REFUND_NOT_ALLOWED: "invalid_transition",
  PAYMENT_REFUND_UNCONFIRMED: "reconciliation_required",
  PAYMENT_ALREADY_REFUNDED: "invalid_transition",
  PAYMENT_REFUND_IN_PROGRESS: "rate_limited",
  ARCA_FORM_URL_HOST_REJECTED: "validation",
  ARCA_TIMEOUT: "timeout",
  ARCA_TRANSPORT: "transport",
  ARCA_AUTH: "authentication",
  ARCA_MALFORMED: "malformed_response",
  ARCA_PROVIDER_REJECTED: "provider_rejected",
  IDRAM_CHECKSUM_INVALID: "checksum_invalid",
  IDRAM_RESULT_MISMATCH: "reference_mismatch",
  IDRAM_TRANSPORT: "transport",
  RATE_LIMITED: "rate_limited",
  OWNERSHIP_DENIED: "ownership_denied",
  RECONCILIATION_REQUIRED: "reconciliation_required",
};

/** Maps a known domain/provider error code into a safe class. */
export function classifyPaymentErrorCode(
  code: string | null | undefined,
): PaymentErrorClass {
  if (!code) return "unknown";
  return CODE_TO_CLASS[code] ?? "unknown";
}

export type OperatorPaymentErrorCopy = {
  errorClass: PaymentErrorClass;
  safeProviderCode: string | null;
  correlationId: string | null;
  recommendedAction: string;
};

const RECOMMENDED_ACTIONS: Record<PaymentErrorClass, string> = {
  configuration: "Verify provider feature flags and required env variable names.",
  validation: "Inspect order/payment identifiers and reject invalid client input.",
  transport: "Retry verification; if persistent, check provider connectivity.",
  provider_rejected: "Review provider response code; do not mark paid locally.",
  authentication: "Rotate or re-enter merchant API credentials out of band.",
  timeout: "Recheck payment status; do not create a duplicate attempt yet.",
  malformed_response: "Capture correlation ID and escalate to provider support.",
  amount_mismatch: "Do not capture; escalate finance review.",
  currency_mismatch: "Do not capture; escalate finance review.",
  reference_mismatch: "Compare local attempt vs provider bill/order identifiers.",
  checksum_invalid: "Reject callback; investigate secret configuration mismatch.",
  ownership_denied: "Require owner session or valid guest access token.",
  invalid_transition: "Inspect current payment status; use retry for new attempts.",
  stock_unavailable: "Keep payment CAPTURED; resolve REQUIRES_REVIEW workflow.",
  reconciliation_required: "Run provider reconcile/audit command for the attempt.",
  rate_limited: "Wait and retry; avoid automated burst rechecks.",
  unknown: "Inspect structured logs with correlation ID; escalate if needed.",
};

export function buildOperatorPaymentErrorCopy(input: {
  code?: string | null;
  correlationId?: string | null;
}): OperatorPaymentErrorCopy {
  const errorClass = classifyPaymentErrorCode(input.code);
  return {
    errorClass,
    safeProviderCode: input.code ?? null,
    correlationId: input.correlationId ?? null,
    recommendedAction: RECOMMENDED_ACTIONS[errorClass],
  };
}
