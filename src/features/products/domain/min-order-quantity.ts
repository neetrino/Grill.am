import type { TranslationsJson } from "@/db/schema";

/**
 * Hardcoded per-product minimum cart line quantities (no schema field).
 * Keys are shared product slugs (same across hy/en/ru).
 */
const MIN_ORDER_QUANTITY_BY_SLUG: Readonly<Record<string, number>> = {
  "havi-gril-mijin": 2,
};

/** Minimum units required for a product slug when the line stays in the cart. */
export function minOrderQuantityForSlug(slug: string): number {
  const normalized = slug.trim().toLowerCase();
  return MIN_ORDER_QUANTITY_BY_SLUG[normalized] ?? 1;
}

/** Resolves min order quantity from any locale slug on the product. */
export function minOrderQuantityFromTranslations(
  translations: TranslationsJson | null | undefined,
): number {
  if (!translations) {
    return 1;
  }
  let min = 1;
  for (const locale of ["hy", "en", "ru"] as const) {
    const slug = translations[locale]?.slug;
    if (slug) {
      min = Math.max(min, minOrderQuantityForSlug(slug));
    }
  }
  return min;
}

/**
 * Rejects a positive quantity below the product minimum.
 * Quantity 0 (line removal) is always allowed.
 */
export function assertPositiveQuantityMeetsMinOrder(
  quantity: number,
  minOrderQuantity: number,
): void {
  if (quantity > 0 && quantity < minOrderQuantity) {
    throw new Error("Below minimum order quantity.");
  }
}

/**
 * Maps a desired cart quantity so values below min become 0 (remove line)
 * instead of an illegal partial quantity.
 */
export function clampCartQuantityToMinOrder(
  quantity: number,
  minOrderQuantity: number,
): number {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return 0;
  }
  if (quantity < minOrderQuantity) {
    return 0;
  }
  return quantity;
}
