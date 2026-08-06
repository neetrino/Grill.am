import { ArcaAmountError } from "@/lib/payments/arca/errors";

/**
 * Official Merchant Manual §7.1.1: amount is N..20 in minimal currency units.
 * §5.6.6: refund amounts use decimal digits (luma / kopecks / cents).
 * Official examples use currency=051 for AMD.
 *
 * Local store amounts for AMD are whole dram (scale 0). ARCA AMD uses luma (×100).
 */
export const ARCA_AMD_CURRENCY_CODE = "051";
export const ARCA_AMD_MINOR_FACTOR = 100n;
export const ARCA_AMOUNT_MAX_DIGITS = 20;
const ARCA_AMOUNT_MAX = 10n ** BigInt(ARCA_AMOUNT_MAX_DIGITS) - 1n;

/** Converts a local AMD whole-dram amount to ARCA minor units (luma). */
export function toArcaAmountMinorUnits(
  localAmount: number,
  currency: string,
): bigint {
  if (currency !== "AMD") {
    throw new ArcaAmountError(
      `ARCA amount conversion supports AMD only (got ${currency}).`,
    );
  }
  if (!Number.isInteger(localAmount)) {
    throw new ArcaAmountError("Local AMD amount must be an integer.");
  }
  if (localAmount < 0) {
    throw new ArcaAmountError("Amount must not be negative.");
  }

  const minor = BigInt(localAmount) * ARCA_AMD_MINOR_FACTOR;
  if (minor > ARCA_AMOUNT_MAX) {
    throw new ArcaAmountError("Amount exceeds ARCA N..20 limit.");
  }
  return minor;
}

/** Parses ARCA amount fields that may arrive as number or numeric string. */
export function parseArcaAmountField(value: unknown): bigint {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      throw new ArcaAmountError("Invalid ARCA amount number.");
    }
    const asBig = BigInt(value);
    if (asBig > ARCA_AMOUNT_MAX) {
      throw new ArcaAmountError("ARCA amount exceeds N..20 limit.");
    }
    return asBig;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const asBig = BigInt(value);
    if (asBig > ARCA_AMOUNT_MAX) {
      throw new ArcaAmountError("ARCA amount exceeds N..20 limit.");
    }
    return asBig;
  }
  throw new ArcaAmountError("ARCA amount field is missing or malformed.");
}

/** Compares provider minor units to the local AMD whole-dram payment amount. */
export function arcaAmountMatchesLocal(
  arcaMinorUnits: bigint,
  localAmount: number,
  currency: string,
): boolean {
  return arcaMinorUnits === toArcaAmountMinorUnits(localAmount, currency);
}

/** Formats minor units for the register request body (decimal digits only). */
export function formatArcaAmountParam(minorUnits: bigint): string {
  if (minorUnits < 0n || minorUnits > ARCA_AMOUNT_MAX) {
    throw new ArcaAmountError("Cannot format out-of-range ARCA amount.");
  }
  return minorUnits.toString(10);
}

/** Normalizes ISO 4217 numeric currency from ARCA (string or number). */
export function normalizeArcaCurrencyCode(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value.toString(10).padStart(3, "0");
  }
  if (typeof value === "string" && /^\d{1,3}$/.test(value)) {
    return value.padStart(3, "0");
  }
  return null;
}

export function isArcaAmdCurrency(code: string | null | undefined): boolean {
  return code === ARCA_AMD_CURRENCY_CODE;
}
