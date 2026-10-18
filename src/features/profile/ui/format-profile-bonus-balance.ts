import type { Locale } from "@/lib/i18n/config";

/** Desktop sidebar bonus line — `Grill Coin: 1 010`. */
export function formatProfileBonusBalance(
  balance: number,
  locale: Locale,
  label: string,
): string {
  const safe = Number.isFinite(balance) ? Math.max(0, Math.floor(balance)) : 0;
  const amount = safe.toLocaleString(locale === "en" ? "en-US" : "ru-RU");
  return `${label}: ${amount}`;
}
