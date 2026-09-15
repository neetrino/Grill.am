import type { Locale } from "@/lib/i18n/config";

/** Builds storefront “+52 Coins” earn label; null when nothing to earn. */
export function formatProductCoinsEarnLabel(
  template: string,
  amount: number,
  locale: Locale,
): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  const formatted = Math.floor(amount).toLocaleString(
    locale === "en" ? "en-US" : "ru-RU",
  );
  return template.replace("{amount}", formatted);
}
