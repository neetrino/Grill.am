import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { getCurrencyMeta } from "@/lib/money/currency-meta";

const NBSP = "\u00A0";

/**
 * Formats money with deterministic separators/symbols per app locale.
 * Avoids Node vs browser ICU mismatches that break SSR hydration
 * (e.g. `hy` → `12 000 ֏` on server, `AMD 12,000` in some browsers).
 */
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
  const appLocale = normalizeMoneyLocale(locale);

  return formatMoneyDeterministic(
    major,
    currency,
    appLocale,
    meta.fractionDigits,
  );
}

function normalizeMoneyLocale(locale: string): Locale {
  const base = locale.split("-")[0] ?? "en";
  return isLocale(base) ? base : "en";
}

function groupIntegerDigits(digits: string, locale: Locale): string {
  const separator = locale === "en" ? "," : NBSP;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function formatMajorNumber(
  major: number,
  locale: Locale,
  fractionDigits: number,
): string {
  const sign = major < 0 ? "-" : "";
  const absolute = Math.abs(major);
  const fixed = absolute.toFixed(fractionDigits);
  const [intPart, fracPart] = fixed.split(".") as [string, string | undefined];
  const grouped = groupIntegerDigits(intPart, locale);

  if (fractionDigits === 0 || fracPart == null) {
    return `${sign}${grouped}`;
  }

  const decimalSeparator = locale === "en" ? "." : ",";
  return `${sign}${grouped}${decimalSeparator}${fracPart}`;
}

function formatMoneyDeterministic(
  major: number,
  currency: Currency,
  locale: Locale,
  fractionDigits: number,
): string {
  const number = formatMajorNumber(major, locale, fractionDigits);

  switch (currency) {
    case "AMD":
      if (locale === "en") return `AMD${NBSP}${number}`;
      if (locale === "hy") return `${number}֏`;
      return `${number}${NBSP}AMD`;
    case "USD":
      if (locale === "en") return `$${number}`;
      return `${number}$`;
    case "RUB":
      if (locale === "en") return `RUB${NBSP}${number}`;
      return `${number}₽`;
  }
}
