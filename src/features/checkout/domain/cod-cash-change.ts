/**
 * AMD banknote denominations a COD customer may pay with so the courier
 * can prepare change (`tendered − order total`).
 */
export const COD_CASH_DENOMINATIONS = [
  1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000,
] as const;

export type CodCashDenomination = (typeof COD_CASH_DENOMINATIONS)[number];

export type CodPaymentMetadata = {
  /** Banknote the customer will tender (AMD major units). Omit when exact. */
  cashTenderedAmount: CodCashDenomination;
};

const DENOMINATION_SET = new Set<number>(COD_CASH_DENOMINATIONS);

export function isCodCashDenomination(
  value: number,
): value is CodCashDenomination {
  return DENOMINATION_SET.has(value);
}

/** Denominations large enough to cover `orderTotalAmount`. */
export function eligibleCodCashDenominations(
  orderTotalAmount: number,
): readonly CodCashDenomination[] {
  if (!Number.isFinite(orderTotalAmount) || orderTotalAmount < 0) {
    return [];
  }
  return COD_CASH_DENOMINATIONS.filter(
    (amount) => amount >= orderTotalAmount,
  );
}

/**
 * Validates a COD tender amount against the authoritative order total.
 * `null` means the customer will pay exactly (no change needed).
 */
export function validateCodCashTenderedAmount(
  orderTotalAmount: number,
  cashTenderedAmount: number | null | undefined,
): { ok: true; changeAmount: number } | { ok: false; error: string } {
  if (cashTenderedAmount == null) {
    return { ok: true, changeAmount: 0 };
  }

  if (!isCodCashDenomination(cashTenderedAmount)) {
    return { ok: false, error: "Invalid cash denomination." };
  }

  if (cashTenderedAmount < orderTotalAmount) {
    return {
      ok: false,
      error: "Selected cash amount is less than the order total.",
    };
  }

  return {
    ok: true,
    changeAmount: cashTenderedAmount - orderTotalAmount,
  };
}

/** Reads typed COD tender metadata from a payment row. */
export function readCodCashTenderedAmount(
  metadata: Record<string, unknown> | null | undefined,
): CodCashDenomination | null {
  if (!metadata) return null;
  const raw = metadata.cashTenderedAmount;
  if (typeof raw !== "number" || !isCodCashDenomination(raw)) {
    return null;
  }
  return raw;
}

export function buildCodPaymentMetadata(
  cashTenderedAmount: CodCashDenomination,
): CodPaymentMetadata {
  return { cashTenderedAmount };
}
