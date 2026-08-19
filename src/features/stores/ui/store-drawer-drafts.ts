import type { StoreLocationTranslationsJson } from "@/db/schema";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";

export type StoreLocaleDraft = {
  title: string;
  address: string;
};

export function emptyStoreDraft(): StoreLocaleDraft {
  return { title: "", address: "" };
}

export function draftsFromStoreTranslations(
  translations: StoreLocationTranslationsJson | undefined,
): Record<Locale, StoreLocaleDraft> {
  const next = {
    hy: emptyStoreDraft(),
    en: emptyStoreDraft(),
    ru: emptyStoreDraft(),
  } satisfies Record<Locale, StoreLocaleDraft>;

  for (const loc of locales) {
    const copy = translations?.[loc];
    if (!copy) continue;
    next[loc] = {
      title: copy.title,
      address: copy.address,
    };
  }

  return next;
}

export function resolveStoreDrawerLocale(
  pageLocale: string,
  translations: StoreLocationTranslationsJson | undefined,
): Locale {
  if (isLocale(pageLocale)) {
    return pageLocale;
  }
  return (
    (locales.find((loc) => translations?.[loc]?.title) as Locale | undefined) ??
    "hy"
  );
}
