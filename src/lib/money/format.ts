import type { Currency } from "@/lib/money/currency";
import { getCurrencyMeta } from "@/lib/money/currency-meta";

/** Formats an integer minor-unit amount with locale-aware currency style. */
export function formatMoneyAmount(
  amount: bigint | number,
  currency: Currency,
  locale: string,
): string {
  const meta = getCurrencyMeta(currency);
  const raw = typeof amount === "bigint" ? Number(amount) : amount;

  if (!Number.isFinite(raw)) {
    throw new Error("Money amount is not finite");
  }

  const major = raw / 10 ** meta.scale;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: meta.fractionDigits,
    maximumFractionDigits: meta.fractionDigits,
  }).format(major);
}
