import { describe, expect, it } from "vitest";

import { formatMoneyAmount } from "@/lib/money/format";

describe("formatMoneyAmount", () => {
  it("formats AMD without fraction digits", () => {
    expect(formatMoneyAmount(12_500, "AMD", "en-US")).toContain("12,500");
  });

  it("formats USD from minor units", () => {
    const formatted = formatMoneyAmount(2600n, "USD", "en-US");
    expect(formatted).toContain("26.00");
  });
});
