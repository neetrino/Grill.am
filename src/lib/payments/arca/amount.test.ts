import { describe, expect, it } from "vitest";

import {
  ARCA_AMD_CURRENCY_CODE,
  ARCA_AMD_MINOR_FACTOR,
  arcaAmountMatchesLocal,
  formatArcaAmountParam,
  normalizeArcaCurrencyCode,
  parseArcaAmountField,
  toArcaAmountMinorUnits,
} from "@/lib/payments/arca/amount";
import { ArcaAmountError } from "@/lib/payments/arca/errors";

describe("ARCA amount conversion (Merchant Manual §7.1.1 / §5.6.6)", () => {
  it("converts whole AMD dram to luma minor units (×100)", () => {
    expect(toArcaAmountMinorUnits(1000, "AMD")).toBe(100_000n);
    expect(toArcaAmountMinorUnits(0, "AMD")).toBe(0n);
    expect(formatArcaAmountParam(100_000n)).toBe("100000");
  });

  it("uses official AMD currency code 051", () => {
    expect(ARCA_AMD_CURRENCY_CODE).toBe("051");
    expect(ARCA_AMD_MINOR_FACTOR).toBe(100n);
    expect(normalizeArcaCurrencyCode(51)).toBe("051");
    expect(normalizeArcaCurrencyCode("051")).toBe("051");
  });

  it("rejects negative, non-integer, and non-AMD", () => {
    expect(() => toArcaAmountMinorUnits(-1, "AMD")).toThrow(ArcaAmountError);
    expect(() => toArcaAmountMinorUnits(1.5, "AMD")).toThrow(ArcaAmountError);
    expect(() => toArcaAmountMinorUnits(10, "USD")).toThrow(ArcaAmountError);
  });

  it("rejects ARCA amount strings beyond N..20", () => {
    expect(() => parseArcaAmountField("1".repeat(21))).toThrow(ArcaAmountError);
  });

  it("matches provider minor units to local AMD amount", () => {
    expect(arcaAmountMatchesLocal(250_000n, 2500, "AMD")).toBe(true);
    expect(arcaAmountMatchesLocal(250_001n, 2500, "AMD")).toBe(false);
  });

  it("parses ARCA amount fields safely", () => {
    expect(parseArcaAmountField(100000)).toBe(100_000n);
    expect(parseArcaAmountField("100000")).toBe(100_000n);
    expect(() => parseArcaAmountField("10.5")).toThrow(ArcaAmountError);
    expect(() => parseArcaAmountField(-1)).toThrow(ArcaAmountError);
  });
});
