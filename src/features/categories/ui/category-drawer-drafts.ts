import type { TranslationsJson } from "@/db/schema";
import type { CategoryLocaleCopy } from "@/features/categories/domain/merge-category-translations";
import { slugifyCategoryTitle } from "@/features/categories/domain/slugify";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";

export type CategoryLocaleDraft = {
  title: string;
  slug: string;
  slugTouched: boolean;
};

export function emptyCategoryDraft(): CategoryLocaleDraft {
  return { title: "", slug: "", slugTouched: false };
}

export function draftsFromCategoryTranslations(
  translations: TranslationsJson | undefined,
): Record<Locale, CategoryLocaleDraft> {
  const next = {
    hy: emptyCategoryDraft(),
    en: emptyCategoryDraft(),
    ru: emptyCategoryDraft(),
  } satisfies Record<Locale, CategoryLocaleDraft>;

  for (const loc of locales) {
    const copy = translations?.[loc];
    if (!copy) continue;
    next[loc] = {
      title: copy.title,
      slug: copy.slug,
      slugTouched: true,
    };
  }

  return next;
}

export function resolveCategoryEditorLocale(
  pageLocale: string,
  translations: TranslationsJson | undefined,
): Locale {
  if (isLocale(pageLocale) && translations?.[pageLocale]?.title?.trim()) {
    return pageLocale;
  }
  const withTitle = locales.find((loc) =>
    Boolean(translations?.[loc]?.title?.trim()),
  );
  if (withTitle) {
    return withTitle;
  }
  return isLocale(pageLocale) ? pageLocale : "hy";
}

export function resolvedCategorySlug(draft: CategoryLocaleDraft): string {
  if (draft.slugTouched && draft.slug.trim()) {
    return draft.slug.trim();
  }
  return slugifyCategoryTitle(draft.title);
}

export function buildCategoryLocaleCopies(
  drafts: Record<Locale, CategoryLocaleDraft>,
): Partial<Record<Locale, CategoryLocaleCopy>> {
  const next: Partial<Record<Locale, CategoryLocaleCopy>> = {};
  for (const loc of locales) {
    const draft = drafts[loc];
    const title = draft.title.trim();
    if (!title) continue;
    const slug = resolvedCategorySlug({ ...draft, title });
    if (!slug) continue;
    next[loc] = { title, slug };
  }
  return next;
}

export function filledCategoryLocales(
  drafts: Record<Locale, CategoryLocaleDraft>,
): Set<Locale> {
  const filled = new Set<Locale>();
  for (const loc of locales) {
    if (drafts[loc].title.trim()) {
      filled.add(loc);
    }
  }
  return filled;
}
