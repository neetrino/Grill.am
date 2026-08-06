import { logger } from "@/lib/observability/logger";

export type PaymentLogFields = {
  correlationId?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  paymentId?: string | null;
  provider?: string | null;
  attemptNumber?: number | null;
  normalizedState?: string | null;
  /** Suffix or short hash only — never full secrets or full refs when sensitive. */
  providerReferenceSuffix?: string | null;
  operation: string;
  durationMs?: number | null;
  errorCode?: string | null;
  errorClass?: string | null;
  idempotentReplay?: boolean;
  requiresReview?: boolean;
  result?: string | null;
};

function suffixRef(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 6) return "••••";
  return value.slice(-6);
}

/** Structured payment log — never pass secrets or raw provider bodies. */
export function logPaymentInfo(
  message: string,
  fields: PaymentLogFields,
): void {
  logger.info(message, sanitizePaymentLogFields(fields));
}

export function logPaymentWarn(
  message: string,
  fields: PaymentLogFields,
): void {
  logger.warn(message, sanitizePaymentLogFields(fields));
}

export function logPaymentError(
  message: string,
  fields: PaymentLogFields,
): void {
  logger.error(message, sanitizePaymentLogFields(fields));
}

export function sanitizePaymentLogFields(
  fields: PaymentLogFields,
): Record<string, string | number | boolean | null | undefined> {
  return {
    correlationId: fields.correlationId ?? undefined,
    orderId: fields.orderId ?? undefined,
    orderNumber: fields.orderNumber ?? undefined,
    paymentId: fields.paymentId ?? undefined,
    provider: fields.provider ?? undefined,
    attemptNumber: fields.attemptNumber ?? undefined,
    normalizedState: fields.normalizedState ?? undefined,
    providerReferenceSuffix:
      fields.providerReferenceSuffix ?? undefined,
    operation: fields.operation,
    durationMs: fields.durationMs ?? undefined,
    errorCode: fields.errorCode ?? undefined,
    errorClass: fields.errorClass ?? undefined,
    idempotentReplay: fields.idempotentReplay,
    requiresReview: fields.requiresReview,
    result: fields.result ?? undefined,
  };
}

export function safeProviderReferenceSuffix(
  reference: string | null | undefined,
): string | null {
  return suffixRef(reference);
}
