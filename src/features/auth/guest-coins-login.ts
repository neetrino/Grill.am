import type { Locale } from "@/lib/i18n/config";

/** Query flag that opens the coins explainer beside the login form. */
export const AUTH_FROM_COINS = "coins";

export function isCoinsAuthEntry(
  from: string | string[] | undefined,
): boolean {
  const value = Array.isArray(from) ? from[0] : from;
  return value === AUTH_FROM_COINS;
}

/** Guest coins pill → login with coins panel, then bonuses after sign-in. */
export function guestCoinsLoginHref(locale: Locale): string {
  const next = `/${locale}/profile/bonuses`;
  return `/${locale}/login?from=${AUTH_FROM_COINS}&next=${encodeURIComponent(next)}`;
}
