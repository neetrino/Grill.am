import type { TranslationsJson } from "@/db/schema";
import { locales, type Locale } from "@/lib/i18n/config";

export type CategoryLocaleCopy = {
  title: string;
  slug: string;
};

/** Merges filled locale drafts into existing category translations. */
export function mergeCategoryTranslations(
  existing: TranslationsJson | null | undefined,
  copies: Partial<Record<Locale, CategoryLocaleCopy>>,
): TranslationsJson {
  const merged: TranslationsJson = { ...(existing ?? {}) };
  for (const loc of locales) {
    const copy = copies[loc];
    if (!copy) continue;
    merged[loc] = {
      ...merged[loc],
      title: copy.title,
      slug: copy.slug,
    };
  }
  return merged;
}

/** True when at least one locale has a non-empty title. */
export function hasCategoryLocaleCopy(
  copies: Partial<Record<Locale, CategoryLocaleCopy>>,
): boolean {
  return locales.some((loc) => Boolean(copies[loc]?.title.trim()));
}
