/**
 * Computes the next payment attempt number from the current max.
 * Application logic only — Phase 2 should enforce UNIQUE (order_id, attempt_number).
 */
export function nextPaymentAttemptNumber(
  currentMaxAttempt: number | null | undefined,
): number {
  const max = currentMaxAttempt ?? 0;
  if (!Number.isFinite(max) || max < 0) {
    return 1;
  }
  return Math.floor(max) + 1;
}
