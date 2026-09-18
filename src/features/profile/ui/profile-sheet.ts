import type { Locale } from "@/lib/i18n/config";
import type { ProfileNavKey } from "@/features/profile/ui/profile-ui";

/** Opens the bonuses sheet on the profile hub (`ProfileMobileMenu`). */
export const PROFILE_SHEET_QUERY = "sheet";
export const PROFILE_COINS_SHEET = "bonuses" as const;

/** Mobile coins destination — profile hub with the bonuses sheet. */
export function profileCoinsHref(locale: Locale): string {
  return `/${locale}/profile?${PROFILE_SHEET_QUERY}=${PROFILE_COINS_SHEET}`;
}

/** Desktop coins destination — dedicated bonuses page. */
export function profileBonusesPageHref(locale: Locale): string {
  return `/${locale}/profile/bonuses`;
}

export function signedInCoinsHref(locale: Locale, isDesktop: boolean): string {
  return isDesktop ? profileBonusesPageHref(locale) : profileCoinsHref(locale);
}

export function parseProfileSheetParam(
  value: string | string[] | null | undefined,
): ProfileNavKey | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === PROFILE_COINS_SHEET ? PROFILE_COINS_SHEET : null;
}
