import type { Locale } from "@/lib/i18n/config";

export type StoreLocaleCopy = {
  title: string;
  address: string;
};

export type StoreTranslations = Partial<Record<Locale, StoreLocaleCopy>>;

export type StoreRuleError = "TITLE_REQUIRED" | "ADDRESS_REQUIRED";

/** Builds a URL-safe store slug from a title or address. */
export function slugifyStoreLabel(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "store";
}

/** Validates one locale's store copy. */
export function validateStoreLocaleCopy(
  copy: StoreLocaleCopy,
): StoreRuleError | null {
  if (!copy.title.trim()) {
    return "TITLE_REQUIRED";
  }
  if (!copy.address.trim()) {
    return "ADDRESS_REQUIRED";
  }
  return null;
}

/** Validates that every provided locale translation is valid. */
export function validateStoreTranslations(
  translations: StoreTranslations,
): StoreRuleError | null {
  const locales = Object.keys(translations) as Locale[];
  if (locales.length === 0) {
    return "TITLE_REQUIRED";
  }

  for (const locale of locales) {
    const copy = translations[locale];
    if (!copy) {
      continue;
    }
    const error = validateStoreLocaleCopy(copy);
    if (error) {
      return error;
    }
  }

  return null;
}

export function storeRuleErrorMessage(code: StoreRuleError): string {
  switch (code) {
    case "TITLE_REQUIRED":
      return "Title is required for each locale.";
    case "ADDRESS_REQUIRED":
      return "Address is required for each locale.";
  }
}

/** Picks the best available translation for a locale with fallbacks. */
export function resolveStoreTranslation(
  translations: StoreTranslations,
  locale: Locale,
): StoreLocaleCopy | null {
  return (
    translations[locale] ??
    translations.en ??
    translations.hy ??
    translations.ru ??
    null
  );
}
