import { IdramAmountError } from "@/lib/payments/idram/errors";

/**
 * Official Merchant API §2 / §4:
 * - Amount must be greater than zero.
 * - Fraction separated by period (dot).
 * - Confirmation amount noted as format-0.00.
 *
 * Local store amounts are whole AMD integers (scale 0).
 * Form examples use whole amounts without trailing decimals ("1900").
 */

const MAX_WHOLE_AMD = 10_000_000_000; // local safety bound (not official)

/** Formats a local whole-AMD amount for EDP_AMOUNT (official example style). */
export function formatIdramAmount(amountAmd: number): string {
  if (!Number.isInteger(amountAmd)) {
    throw new IdramAmountError("iDram amount must be a whole AMD integer.");
  }
  if (amountAmd <= 0) {
    throw new IdramAmountError("iDram amount must be greater than zero.");
  }
  if (amountAmd > MAX_WHOLE_AMD) {
    throw new IdramAmountError("iDram amount exceeds local safety bound.");
  }
  return String(amountAmd);
}

/**
 * Parses an official EDP_AMOUNT string into whole AMD for business comparison.
 * Accepts "1900" and "1900.00"; rejects commas, scientific notation, excess precision.
 */
export function parseIdramAmount(value: string): number {
  if (typeof value !== "string") {
    throw new IdramAmountError("iDram amount must be a string.");
  }
  const trimmed = value.trim();
  if (trimmed !== value) {
    throw new IdramAmountError("iDram amount must not have surrounding whitespace.");
  }
  if (trimmed === "" || trimmed.includes(",")) {
    throw new IdramAmountError("iDram amount format is invalid.");
  }
  if (/[eE]/.test(trimmed)) {
    throw new IdramAmountError("iDram amount must not use scientific notation.");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new IdramAmountError("iDram amount must use a period decimal with at most 2 places.");
  }
  if (trimmed.includes(".")) {
    const parts = trimmed.split(".");
    const whole = parts[0] ?? "";
    const frac = parts[1] ?? "";
    if (whole === "" || /^0\d+/.test(whole)) {
      throw new IdramAmountError("iDram amount has an invalid leading zero.");
    }
    const fracPadded = (frac + "00").slice(0, 2);
    if (fracPadded !== "00") {
      // Local catalog is whole AMD — non-zero fractional AMD is rejected.
      throw new IdramAmountError("iDram amount fractional part is not supported.");
    }
    const asInt = Number.parseInt(whole, 10);
    if (!Number.isSafeInteger(asInt) || asInt <= 0) {
      throw new IdramAmountError("iDram amount is out of range.");
    }
    return asInt;
  }
  if (/^0\d+/.test(trimmed)) {
    throw new IdramAmountError("iDram amount has an invalid leading zero.");
  }
  const asInt = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(asInt) || asInt <= 0) {
    throw new IdramAmountError("iDram amount is out of range.");
  }
  return asInt;
}

export function idramAmountMatchesLocal(
  edpAmount: string,
  localAmountAmd: number,
): boolean {
  return parseIdramAmount(edpAmount) === localAmountAmd;
}
