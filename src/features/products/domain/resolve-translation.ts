import type { LocaleTranslation, TranslationsJson } from "@/db/schema";
import { locales, type Locale } from "@/lib/i18n/config";

/**
 * Picks copy for the active locale, then hy → en → ru (any locale with a title).
 * Keeps admin/storefront visible when only some locales are filled.
 */
export function resolveProductTranslation(
  translations: TranslationsJson | null | undefined,
  locale: Locale,
): LocaleTranslation | null {
  if (!translations) return null;

  const preferred: Locale[] = [
    locale,
    ...locales.filter((candidate) => candidate !== locale),
  ];

  for (const candidate of preferred) {
    const copy = translations[candidate];
    if (copy?.title?.trim()) {
      return copy;
    }
  }

  return (
    translations[locale] ??
    translations.hy ??
    translations.en ??
    translations.ru ??
    null
  );
}
