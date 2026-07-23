import { convertAmount, convertQuoteToBase } from "@/lib/money/convert";
import type { Currency } from "@/lib/money/currency";
import { defaultCurrency } from "@/lib/money/currency";
import { getCurrencyMeta } from "@/lib/money/currency-meta";

/** Display-currency major units → base AMD minor units. */
export function displayMajorToAmd(
  majorUnits: number,
  displayCurrency: Currency,
  rate: string,
): number {
  const meta = getCurrencyMeta(displayCurrency);
  const minorUnits = BigInt(majorUnits) * 10n ** BigInt(meta.scale);
  const amd = convertQuoteToBase(
    minorUnits,
    rate,
    displayCurrency,
    defaultCurrency,
  );
  return Number(amd.amount);
}

/** Base AMD minor units → display-currency major units (floor). */
export function amdToDisplayMajor(
  amdAmount: number,
  displayCurrency: Currency,
  rate: string,
): number {
  const converted = convertAmount(
    amdAmount,
    rate,
    defaultCurrency,
    displayCurrency,
  );
  const meta = getCurrencyMeta(displayCurrency);
  const major = converted.amount / 10n ** BigInt(meta.scale);
  return Number(major);
}
