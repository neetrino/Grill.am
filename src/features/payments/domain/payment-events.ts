/**
 * Safe payment event kinds stored in `order_events.payload.kind`.
 * DB enum remains `PAYMENT_PROVIDER` — kinds live in payload for Phase 1
 * without a schema migration.
 */
export const PAYMENT_EVENT_KINDS = [
  "ORDER_CREATED",
  "PAYMENT_ATTEMPT_CREATED",
  "PAYMENT_PROVIDER_INITIALIZED",
  "PAYMENT_REDIRECT_STARTED",
  "PAYMENT_PRECHECK_ACCEPTED",
  "PAYMENT_PRECHECK_REJECTED",
  "PAYMENT_CONFIRMATION_RECEIVED",
  "PAYMENT_CAPTURED",
  "PAYMENT_FAILED",
  "PAYMENT_CANCELLED",
  "PAYMENT_EXPIRED",
  "PAYMENT_RETRY_CREATED",
  "PAYMENT_REPLAYED",
  "PAYMENT_CONFIRMATION_REPLAYED",
  "PAYMENT_REQUIRES_REVIEW",
  "PAYMENT_REVIEW_RESOLVED",
  "ARCA_REGISTERED",
  "ARCA_REGISTER_RECOVERED",
  "ARCA_REGISTER_DUPLICATE_RECOVERED",
  "ARCA_REGISTER_UNCERTAIN",
  "ARCA_STATUS_REVIEW",
  "PROVIDER_PAID_STOCK_UNAVAILABLE",
  "CART_CLEANUP_SKIPPED",
  "STOCK_FULFILLMENT_FAILED",
  "IDRAM_FORM_CREATED",
  "IDRAM_PRECHECK_ACCEPTED",
  "IDRAM_PRECHECK_REJECTED",
  "IDRAM_CONFIRMATION_RECEIVED",
  "IDRAM_CONFIRMATION_REPLAYED",
  "IDRAM_CHECKSUM_INVALID",
  "IDRAM_RESULT_MISMATCH",
  "IDRAM_SUCCESS_REDIRECT",
  "IDRAM_FAIL_REDIRECT",
  "IDRAM_ATTEMPT_EXPIRED",
] as const;

export type PaymentEventKind = (typeof PAYMENT_EVENT_KINDS)[number] | (string & {});

export type SafePaymentEventPayload = {
  kind: PaymentEventKind;
  provider: string;
  paymentId: string;
  attemptNumber: number;
  providerReference?: string | null;
  status: string;
  verifiedAmount?: number;
  verifiedCurrency?: string;
  errorCode?: string;
  sourceCartId?: string;
};

/** Builds a redacted payment event payload (no secrets / PII / raw callbacks). */
export function buildSafePaymentEventPayload(
  input: SafePaymentEventPayload,
): Record<string, unknown> {
  return {
    kind: input.kind,
    provider: input.provider,
    paymentId: input.paymentId,
    attemptNumber: input.attemptNumber,
    providerReference: input.providerReference ?? null,
    status: input.status,
    ...(input.verifiedAmount !== undefined
      ? { verifiedAmount: input.verifiedAmount }
      : {}),
    ...(input.verifiedCurrency !== undefined
      ? { verifiedCurrency: input.verifiedCurrency }
      : {}),
    ...(input.errorCode !== undefined ? { errorCode: input.errorCode } : {}),
    ...(input.sourceCartId !== undefined
      ? { sourceCartId: input.sourceCartId }
      : {}),
  };
}
