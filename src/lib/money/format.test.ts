import { describe, expect, it } from "vitest";

import { formatMoneyAmount } from "@/lib/money/format";

describe("formatMoneyAmount", () => {
  it("formats AMD with the dram symbol for every app locale", () => {
    expect(formatMoneyAmount(12_500, "AMD", "en")).toBe("12,500֏");
    expect(formatMoneyAmount(12_500, "AMD", "en-US")).toBe("12,500֏");
    expect(formatMoneyAmount(12_000, "AMD", "hy")).toBe("12\u00A0000֏");
    expect(formatMoneyAmount(12_000, "AMD", "ru")).toBe("12\u00A0000֏");
  });

  it("formats USD from minor units", () => {
    expect(formatMoneyAmount(2600n, "USD", "en")).toBe("$26.00");
    expect(formatMoneyAmount(2600n, "USD", "hy")).toBe("26,00$");
  });

  it("formats RUB with the ruble symbol for every app locale", () => {
    expect(formatMoneyAmount(2400, "RUB", "en")).toBe("24.00₽");
    expect(formatMoneyAmount(2400, "RUB", "ru")).toBe("24,00₽");
  });
});
