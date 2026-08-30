import { describe, expect, it } from "vitest";

import { formatBaseCatalogPrice } from "@/lib/money/catalog-price";

describe("formatBaseCatalogPrice", () => {
  it("formats AMD without reading cookies or FX", () => {
    const price = formatBaseCatalogPrice(12_500, "en");

    expect(price.displayCurrency).toBe("AMD");
    expect(price.rate).toBe("1");
    expect(price.rateSource).toBe("identity");
    expect(price.formatted).toBe("12,500֏");
  });
});
