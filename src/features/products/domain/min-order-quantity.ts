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
 * Maps a desired cart quantity: values below min are raised to min (not removed).
 * Explicit zero still removes the line.
 */
export function resolveCartLineQuantity(
  quantity: number,
  minOrderQuantity: number,
): { quantity: number; raisedToMin: boolean } {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { quantity: 0, raisedToMin: false };
  }
  if (quantity < minOrderQuantity) {
    return { quantity: minOrderQuantity, raisedToMin: true };
  }
  return { quantity, raisedToMin: false };
}

/** @deprecated Use resolveCartLineQuantity — kept for cart page server actions. */
export function clampCartQuantityToMinOrder(
  quantity: number,
  minOrderQuantity: number,
): number {
  return resolveCartLineQuantity(quantity, minOrderQuantity).quantity;
}
