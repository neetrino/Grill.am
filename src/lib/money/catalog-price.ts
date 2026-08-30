import { convertAmount } from "@/lib/money/convert";
import { defaultCurrency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

export type CatalogDisplayPrice = {
  baseAmount: number;
  baseCurrency: typeof defaultCurrency;
  displayAmount: bigint;
  displayCurrency: typeof defaultCurrency;
  rate: string;
  rateSource: string;
  formatted: string;
};

/**
 * AMD catalog price with no cookie or FX I/O — safe for ISR HTML.
 */
export function formatBaseCatalogPrice(
  baseAmountAmd: number,
  locale: string,
): CatalogDisplayPrice {
  const converted = convertAmount(
    baseAmountAmd,
    "1",
    defaultCurrency,
    defaultCurrency,
  );

  return {
    baseAmount: baseAmountAmd,
    baseCurrency: defaultCurrency,
    displayAmount: converted.amount,
    displayCurrency: defaultCurrency,
    rate: "1",
    rateSource: "identity",
    formatted: formatMoneyAmount(converted.amount, defaultCurrency, locale),
  };
}
