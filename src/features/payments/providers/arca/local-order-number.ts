/**
 * Deterministic provider-facing orderNumber for one local payment attempt.
 * Merchant Manual §7.1.1: orderNumber AN..32.
 *
 * Format: a{attempt}-{paymentIdWithoutHyphens} truncated to 32.
 * Maps 1:1 to a payment attempt; stable across re-initialization.
 */
export const ARCA_LOCAL_ORDER_NUMBER_MAX_LEN = 32;

export function buildArcaLocalOrderNumber(
  paymentId: string,
  attemptNumber: number,
): string {
  const compactId = paymentId.replace(/-/g, "").toLowerCase();
  const prefix = `a${attemptNumber}-`;
  const remaining = ARCA_LOCAL_ORDER_NUMBER_MAX_LEN - prefix.length;
  if (remaining < 8) {
    throw new Error("Unable to build ARCA local order number.");
  }
  const body = compactId.slice(0, remaining);
  const value = `${prefix}${body}`;
  if (value.length > ARCA_LOCAL_ORDER_NUMBER_MAX_LEN) {
    throw new Error("ARCA local order number exceeds AN..32.");
  }
  if (!/^[A-Za-z0-9-]+$/.test(value)) {
    throw new Error("ARCA local order number has invalid characters.");
  }
  return value;
}
