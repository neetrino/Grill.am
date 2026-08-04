import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const RU_MONTHS = [
  "янв.",
  "февр.",
  "мар.",
  "апр.",
  "мая",
  "июн.",
  "июл.",
  "авг.",
  "сент.",
  "окт.",
  "нояб.",
  "дек.",
] as const;

const HY_MONTHS = [
  "հնվ",
  "փտվ",
  "մրտ",
  "ապր",
  "մյս",
  "հնս",
  "հլս",
  "օգս",
  "սպտ",
  "հկտ",
  "նյմ",
  "դկտ",
] as const;

function normalizeDateLocale(locale: string): Locale {
  const base = locale.split("-")[0] ?? "en";
  return isLocale(base) ? base : "en";
}

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Short calendar date, identical on Node and every browser.
 * Uses UTC calendar fields so SSR (often UTC) and clients in other
 * timezones hydrate to the same string. Avoids `Intl.DateTimeFormat`
 * ICU gaps (e.g. `hy` falling back to Russian).
 */
export function formatShortDate(
  value: Date | string | number,
  locale: string,
): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  const appLocale = normalizeDateLocale(locale);
  const day = date.getUTCDate();
  const monthIndex = date.getUTCMonth();
  const year = date.getUTCFullYear();

  switch (appLocale) {
    case "en":
      return `${EN_MONTHS[monthIndex]} ${day}, ${year}`;
    case "ru":
      return `${day} ${RU_MONTHS[monthIndex]} ${year} г.`;
    case "hy":
      return `${day} ${HY_MONTHS[monthIndex]}, ${year} թ.`;
  }
}
