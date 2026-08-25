import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { toAppZonedParts } from "@/lib/datetime/app-timezone";

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

const SHORT_MONTHS: Record<Locale, readonly string[]> = {
  en: EN_MONTHS,
  ru: RU_MONTHS,
  hy: HY_MONTHS,
};

function normalizeDateLocale(locale: string): Locale {
  const base = locale.split("-")[0] ?? "en";
  return isLocale(base) ? base : "en";
}

/** Short month label (0 = January). Avoids Intl ICU gaps for `hy`. */
export function shortMonthName(locale: Locale, monthIndex: number): string {
  return SHORT_MONTHS[locale][monthIndex] ?? "";
}

/**
 * Short calendar date in app timezone (UTC+4 / Asia/Yerevan).
 * Identical on Node and every browser (fixed offset, no Intl ICU gaps).
 */
export function formatShortDate(
  value: Date | string | number,
  locale: string,
): string {
  const parts = toAppZonedParts(value);
  const appLocale = normalizeDateLocale(locale);
  const day = parts.day;
  const monthIndex = parts.monthIndex;
  const year = parts.year;

  switch (appLocale) {
    case "en":
      return `${EN_MONTHS[monthIndex]} ${day}, ${year}`;
    case "ru":
      return `${day} ${RU_MONTHS[monthIndex]} ${year} г.`;
    case "hy":
      return `${day} ${HY_MONTHS[monthIndex]}, ${year} թ.`;
  }
}
