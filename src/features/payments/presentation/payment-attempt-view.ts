/**
 * Safe payment attempt DTOs for customer and admin surfaces.
 * Never include secrets, checksums, raw callbacks, or guest tokens.
 */

export type CustomerPaymentAttemptView = {
  paymentId: string;
  provider: string;
  paymentMethod: string;
  attemptNumber: number;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  capturedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  /** Last 6 characters of provider reference when present. */
  providerReferenceSuffix: string | null;
  isLatest: boolean;
  isCurrent: boolean;
  customerStatus: string;
  retryEligible: boolean;
  recheckEligible: boolean;
};

export type AdminPaymentAttemptView = {
  paymentId: string;
  provider: string;
  paymentMethod: string;
  attemptNumber: number;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  initializedAt: string | null;
  authorizedAt: string | null;
  capturedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  lastVerifiedAt: string | null;
  providerReferenceSuffix: string | null;
  providerOrderNumber: string | null;
  sourceCartId: string | null;
  isLatest: boolean;
  isCurrent: boolean;
  operatorStatus: string;
  retryEligible: boolean;
  recheckEligible: boolean;
  reviewReason: string | null;
};

export type PaymentAttemptRow = {
  id: string;
  provider: string;
  method: string;
  status: string;
  attemptNumber: number;
  amount: number;
  currency: string;
  providerReference: string | null;
  providerOrderNumber: string | null;
  createdAt: Date;
  authorizedAt: Date | null;
  capturedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
};

function suffix(reference: string | null | undefined): string | null {
  if (!reference || reference.length < 4) {
    return reference ? "••••" : null;
  }
  return reference.slice(-6);
}

function readIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function readMetaString(
  metadata: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readMetaDate(
  metadata: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = metadata?.[key];
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

const SENSITIVE_META_KEYS = new Set([
  "password",
  "secret",
  "checksum",
  "rawCallback",
  "guestToken",
  "apiPassword",
  "EDP_CHECKSUM",
  "payerAccount",
]);

/** Ensures metadata keys used for display never leak sensitive names. */
export function assertSafePaymentMetadataKeys(
  metadata: Record<string, unknown> | null,
): void {
  if (!metadata) return;
  for (const key of Object.keys(metadata)) {
    if (SENSITIVE_META_KEYS.has(key)) {
      throw new Error(`Unsafe payment metadata key exposed: ${key}`);
    }
  }
}

export function toCustomerPaymentAttemptViews(
  rows: PaymentAttemptRow[],
  options: {
    customerStatusByPaymentId: Record<string, string>;
    retryEligiblePaymentId: string | null;
    recheckEligiblePaymentId: string | null;
  },
): CustomerPaymentAttemptView[] {
  const latestAttempt = Math.max(0, ...rows.map((row) => row.attemptNumber));
  return rows.map((row) => ({
    paymentId: row.id,
    provider: row.provider,
    paymentMethod: row.method,
    attemptNumber: row.attemptNumber,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    createdAt: row.createdAt.toISOString(),
    capturedAt: readIso(row.capturedAt),
    failedAt: readIso(row.failedAt),
    cancelledAt: readIso(row.cancelledAt),
    expiresAt: readIso(row.expiresAt),
    providerReferenceSuffix: suffix(row.providerReference),
    isLatest: row.attemptNumber === latestAttempt,
    isCurrent: row.status === "CAPTURED" || row.attemptNumber === latestAttempt,
    customerStatus:
      options.customerStatusByPaymentId[row.id] ?? row.status.toLowerCase(),
    retryEligible: options.retryEligiblePaymentId === row.id,
    recheckEligible: options.recheckEligiblePaymentId === row.id,
  }));
}

export function toAdminPaymentAttemptViews(
  rows: PaymentAttemptRow[],
  options: {
    operatorStatusByPaymentId?: Record<string, string>;
    reviewReason?: string | null;
    sourceCartId?: string | null;
    retryEligiblePaymentId?: string | null;
    recheckEligiblePaymentId?: string | null;
  } = {},
): AdminPaymentAttemptView[] {
  const latestAttempt = Math.max(0, ...rows.map((row) => row.attemptNumber));
  return rows.map((row) => {
    assertSafePaymentMetadataKeys(row.metadata);
    return {
      paymentId: row.id,
      provider: row.provider,
      paymentMethod: row.method,
      attemptNumber: row.attemptNumber,
      status: row.status,
      amount: row.amount,
      currency: row.currency,
      createdAt: row.createdAt.toISOString(),
      initializedAt:
        readMetaDate(row.metadata, "initializedAt") ??
        readMetaDate(row.metadata, "registeredAt"),
      authorizedAt: readIso(row.authorizedAt),
      capturedAt: readIso(row.capturedAt),
      failedAt: readIso(row.failedAt),
      cancelledAt: readIso(row.cancelledAt),
      expiresAt: readIso(row.expiresAt),
      lastVerifiedAt: readMetaDate(row.metadata, "lastVerifiedAt"),
      providerReferenceSuffix: suffix(row.providerReference),
      providerOrderNumber: row.providerOrderNumber,
      sourceCartId: options.sourceCartId ?? null,
      isLatest: row.attemptNumber === latestAttempt,
      isCurrent:
        row.status === "CAPTURED" || row.attemptNumber === latestAttempt,
      operatorStatus:
        options.operatorStatusByPaymentId?.[row.id] ?? row.status,
      retryEligible: options.retryEligiblePaymentId === row.id,
      recheckEligible: options.recheckEligiblePaymentId === row.id,
      reviewReason: options.reviewReason ?? readMetaString(row.metadata, "reviewReason"),
    };
  });
}

/** Fields that must never appear on customer DTOs. */
export const FORBIDDEN_CUSTOMER_PAYMENT_FIELDS = [
  "providerReference",
  "guestAccessToken",
  "guestAccessTokenHash",
  "checksum",
  "secret",
  "password",
  "rawCallback",
  "EDP_CHECKSUM",
  "payerAccount",
] as const;
