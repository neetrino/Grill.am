/**
 * Deterministic EDP_BILL_NO for one local payment attempt.
 * Official Merchant API §2: "bill ID according to his accounting system"
 * (length/charset not specified — local policy AN..64).
 */
export const IDRAM_BILL_NO_MAX_LEN = 64;

export function buildIdramBillNumber(
  paymentId: string,
  attemptNumber: number,
): string {
  const compact = paymentId.replace(/-/g, "").toLowerCase();
  const prefix = `i${attemptNumber}-`;
  const body = compact.slice(0, IDRAM_BILL_NO_MAX_LEN - prefix.length);
  const value = `${prefix}${body}`;
  if (value.length > IDRAM_BILL_NO_MAX_LEN) {
    throw new Error("iDram bill number exceeds local length policy.");
  }
  if (!/^[A-Za-z0-9-]+$/.test(value)) {
    throw new Error("iDram bill number has invalid characters.");
  }
  return value;
}
