import type { LocaleTranslation, TranslationsJson } from "@/db/schema";
import { locales } from "@/lib/i18n/config";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lowercases and hyphenates a product slug for storage and lookup. */
export function normalizeProductSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isValidProductSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Resolves the shared product slug from any available locale copy. */
export function resolveSharedProductSlug(
  translations: TranslationsJson | null | undefined,
): string {
  if (!translations) return "";
  const copy =
    translations.hy ?? translations.en ?? translations.ru ?? null;
  return copy ? normalizeProductSlug(copy.slug) : "";
}

/**
 * Applies one shared slug to every present locale copy.
 * Product URLs use a single slug across hy/en/ru.
 */
export function withSharedProductSlug(
  translations: TranslationsJson,
  slug: string,
): TranslationsJson {
  const normalized = normalizeProductSlug(slug);
  const next: TranslationsJson = {};
  for (const locale of locales) {
    const copy = translations[locale];
    if (!copy) continue;
    next[locale] = { ...copy, slug: normalized } satisfies LocaleTranslation;
  }
  return next;
}
