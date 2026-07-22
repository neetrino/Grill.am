import type { LocaleTranslation, TranslationsJson } from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";

/**
 * Picks copy for the active storefront locale with hy → en → ru fallback.
 * Keeps PDP/catalog visible when only some locales are filled.
 */
export function resolveProductTranslation(
  translations: TranslationsJson | null | undefined,
  locale: Locale,
): LocaleTranslation | null {
  if (!translations) return null;
  return (
    translations[locale] ??
    translations.hy ??
    translations.en ??
    translations.ru ??
    null
  );
}
