import { describe, expect, it } from "vitest";

import {
  COD_CASH_DENOMINATIONS,
  eligibleCodCashDenominations,
  isCodCashDenomination,
  readCodCashTenderedAmount,
  validateCodCashTenderedAmount,
} from "@/features/checkout/domain/cod-cash-change";

describe("cod-cash-change", () => {
  it("exposes the expected AMD denominations", () => {
    expect([...COD_CASH_DENOMINATIONS]).toEqual([
      5_000, 10_000, 20_000, 50_000, 100_000,
    ]);
  });

  it("filters denominations that cover the order total", () => {
    expect([...eligibleCodCashDenominations(4_500)]).toEqual([
      5_000, 10_000, 20_000, 50_000, 100_000,
    ]);
    expect([...eligibleCodCashDenominations(5_000)]).toEqual([
      5_000, 10_000, 20_000, 50_000, 100_000,
    ]);
    expect([...eligibleCodCashDenominations(12_000)]).toEqual([
      20_000, 50_000, 100_000,
    ]);
    expect([...eligibleCodCashDenominations(100_001)]).toEqual([]);
  });

  it("accepts exact payment (no tendered amount)", () => {
    expect(validateCodCashTenderedAmount(7_500, null)).toEqual({
      ok: true,
      changeAmount: 0,
    });
    expect(validateCodCashTenderedAmount(7_500, undefined)).toEqual({
      ok: true,
      changeAmount: 0,
    });
  });

  it("rejects amounts below the order total", () => {
    expect(validateCodCashTenderedAmount(12_000, 10_000).ok).toBe(false);
  });

  it("computes change for a valid denomination", () => {
    expect(validateCodCashTenderedAmount(7_500, 10_000)).toEqual({
      ok: true,
      changeAmount: 2_500,
    });
  });

  it("rejects unknown denominations", () => {
    expect(isCodCashDenomination(1_000)).toBe(false);
    expect(validateCodCashTenderedAmount(500, 1_000).ok).toBe(false);
  });

  it("reads typed metadata safely", () => {
    expect(readCodCashTenderedAmount({ cashTenderedAmount: 20_000 })).toBe(
      20_000,
    );
    expect(readCodCashTenderedAmount({ cashTenderedAmount: 999 })).toBeNull();
    expect(readCodCashTenderedAmount(null)).toBeNull();
  });
});
