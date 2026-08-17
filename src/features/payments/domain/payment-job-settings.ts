/**
 * Scheduled payment reconcile / pending TTL settings.
 * Interval drives Vercel Cron (every N minutes); timeout sets local attempt expiresAt.
 */

export const DEFAULT_PAYMENT_RECONCILE_INTERVAL_MINUTES = 30;
export const DEFAULT_PAYMENT_PENDING_TIMEOUT_MINUTES = 60;

const MIN_RECONCILE_INTERVAL_MINUTES = 5;
const MAX_RECONCILE_INTERVAL_MINUTES = 120;
const MIN_PENDING_TIMEOUT_MINUTES = 10;
const MAX_PENDING_TIMEOUT_MINUTES = 24 * 60;

export type PaymentJobSettings = {
  reconcileIntervalMinutes: number;
  pendingTimeoutMinutes: number;
};

function parseBoundedMinutes(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
  label: string,
): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `${label} must be an integer between ${min} and ${max}.`,
    );
  }
  return parsed;
}

/** Parses reconcile/timeout minutes from raw env strings. */
export function parsePaymentJobSettings(input: {
  reconcileIntervalMinutes?: string;
  pendingTimeoutMinutes?: string;
}): PaymentJobSettings {
  return {
    reconcileIntervalMinutes: parseBoundedMinutes(
      input.reconcileIntervalMinutes,
      DEFAULT_PAYMENT_RECONCILE_INTERVAL_MINUTES,
      MIN_RECONCILE_INTERVAL_MINUTES,
      MAX_RECONCILE_INTERVAL_MINUTES,
      "PAYMENT_RECONCILE_INTERVAL_MINUTES",
    ),
    pendingTimeoutMinutes: parseBoundedMinutes(
      input.pendingTimeoutMinutes,
      DEFAULT_PAYMENT_PENDING_TIMEOUT_MINUTES,
      MIN_PENDING_TIMEOUT_MINUTES,
      MAX_PENDING_TIMEOUT_MINUTES,
      "PAYMENT_PENDING_TIMEOUT_MINUTES",
    ),
  };
}

export function pendingTimeoutMsFromMinutes(minutes: number): number {
  return minutes * 60 * 1000;
}
