import { describe, expect, it } from "vitest";

import {
  DEFAULT_ENABLED_CURRENCIES,
  DEFAULT_FX_RATES,
  DEFAULT_REVENUE_STATUSES,
  listEnabledCurrencies,
  meetsMinimumOrder,
  parseEnabledCurrencies,
  parseFxRates,
  parseMaintenance,
  parseMinimumOrder,
  parseRevenueStatuses,
  parseStacking,
  resolveEnabledDisplayCurrency,
} from "@/features/settings/domain/store-settings";

describe("store settings parsers", () => {
  it("defaults revenue statuses safely", () => {
    expect(parseRevenueStatuses(null)).toEqual(DEFAULT_REVENUE_STATUSES);
    expect(parseRevenueStatuses({ statuses: ["DELIVERED", "CANCELLED"] })).toEqual([
      "DELIVERED",
    ]);
  });

  it("parses maintenance and stacking flags", () => {
    expect(parseMaintenance({ enabled: true, message: "Back soon" })).toEqual({
      enabled: true,
      message: "Back soon",
    });
    expect(parseStacking({ allowCouponWithAutomatic: true })).toEqual({
      allowCouponWithAutomatic: true,
    });
  });

  it("parses fx rates with defaults for invalid values", () => {
    expect(parseFxRates(null)).toEqual(DEFAULT_FX_RATES);
    expect(parseFxRates({ usd: "0.003", rub: "0.25" })).toEqual({
      usd: "0.003",
      rub: "0.25",
    });
    expect(parseFxRates({ usd: "0,2137", rub: "1,5" })).toEqual({
      usd: "0.2137",
      rub: "1.5",
    });
    expect(parseFxRates({ usd: "0", rub: "abc" })).toEqual(DEFAULT_FX_RATES);
  });

  it("parses minimum order amount", () => {
    expect(parseMinimumOrder(null)).toEqual({ amount: null });
    expect(parseMinimumOrder({ amount: 5000 })).toEqual({ amount: 5000 });
    expect(parseMinimumOrder({ amount: 0 })).toEqual({ amount: null });
    expect(parseMinimumOrder({ amount: -1 })).toEqual({ amount: null });
    expect(parseMinimumOrder({ amount: 1.5 })).toEqual({ amount: null });
  });

  it("evaluates minimum order against subtotal", () => {
    expect(meetsMinimumOrder(1000, null)).toBe(true);
    expect(meetsMinimumOrder(1000, 0)).toBe(true);
    expect(meetsMinimumOrder(5000, 5000)).toBe(true);
    expect(meetsMinimumOrder(4999, 5000)).toBe(false);
  });

  it("defaults enabled currencies and rejects an empty set", () => {
    expect(parseEnabledCurrencies(null)).toEqual(DEFAULT_ENABLED_CURRENCIES);
    expect(parseEnabledCurrencies({})).toEqual(DEFAULT_ENABLED_CURRENCIES);
    expect(
      parseEnabledCurrencies({ AMD: false, USD: false, RUB: false }),
    ).toEqual(DEFAULT_ENABLED_CURRENCIES);
    expect(
      parseEnabledCurrencies({ AMD: true, USD: false, RUB: false }),
    ).toEqual({ AMD: true, USD: false, RUB: false });
  });

  it("lists enabled currencies and clamps the display choice", () => {
    expect(
      listEnabledCurrencies({ AMD: true, USD: false, RUB: true }),
    ).toEqual(["AMD", "RUB"]);
    expect(resolveEnabledDisplayCurrency("USD", ["AMD", "RUB"])).toBe("AMD");
    expect(resolveEnabledDisplayCurrency("RUB", ["USD"])).toBe("USD");
    expect(resolveEnabledDisplayCurrency("USD", ["AMD", "USD"])).toBe("USD");
  });
});
