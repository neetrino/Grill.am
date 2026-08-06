import { describe, expect, it } from "vitest";

import {
  formatIdramAmount,
  idramAmountMatchesLocal,
  parseIdramAmount,
} from "@/lib/payments/idram/amount";
import { IdramAmountError } from "@/lib/payments/idram/errors";

describe("iDram amount", () => {
  it("formats whole AMD like the official example", () => {
    expect(formatIdramAmount(1)).toBe("1");
    expect(formatIdramAmount(100)).toBe("100");
    expect(formatIdramAmount(1900)).toBe("1900");
  });

  it("rejects zero, negative, non-integer format inputs", () => {
    expect(() => formatIdramAmount(0)).toThrow(IdramAmountError);
    expect(() => formatIdramAmount(-1)).toThrow(IdramAmountError);
    expect(() => formatIdramAmount(1.5)).toThrow(IdramAmountError);
  });

  it("parses whole and .00 amounts", () => {
    expect(parseIdramAmount("1")).toBe(1);
    expect(parseIdramAmount("100")).toBe(100);
    expect(parseIdramAmount("1900.00")).toBe(1900);
    expect(parseIdramAmount("1900.0")).toBe(1900);
  });

  it("rejects invalid amount strings", () => {
    for (const bad of [
      "0",
      "-1",
      "1,900",
      "1.2.3",
      "1.001",
      "01",
      " 100",
      "100 ",
      "1e3",
      "1E2",
      "",
      "abc",
    ]) {
      expect(() => parseIdramAmount(bad), bad).toThrow(IdramAmountError);
    }
  });

  it("matches local amount without float equality", () => {
    expect(idramAmountMatchesLocal("2500", 2500)).toBe(true);
    expect(idramAmountMatchesLocal("2500.00", 2500)).toBe(true);
    expect(idramAmountMatchesLocal("2501", 2500)).toBe(false);
  });
});
