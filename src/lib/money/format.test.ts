import { describe, expect, it } from "vitest";

import { formatMoneyAmount } from "@/lib/money/format";

describe("formatMoneyAmount", () => {
  it("formats AMD for English with a stable currency code prefix", () => {
    expect(formatMoneyAmount(12_500, "AMD", "en")).toBe("AMD\u00A012,500");
    expect(formatMoneyAmount(12_500, "AMD", "en-US")).toContain("12,500");
  });

  it("formats AMD for Armenian with the dram symbol (hydration-stable)", () => {
    expect(formatMoneyAmount(12_000, "AMD", "hy")).toBe("12\u00A0000֏");
  });

  it("formats AMD for Russian with a stable currency code suffix", () => {
    expect(formatMoneyAmount(12_000, "AMD", "ru")).toBe("12\u00A0000\u00A0AMD");
  });

  it("formats USD from minor units", () => {
    expect(formatMoneyAmount(2600n, "USD", "en")).toBe("$26.00");
    expect(formatMoneyAmount(2600n, "USD", "hy")).toBe("26,00$");
  });
});
