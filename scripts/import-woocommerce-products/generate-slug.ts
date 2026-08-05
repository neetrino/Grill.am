import {
  isValidProductSlug,
  normalizeProductSlug,
} from "@/features/products/domain/product-slug";

import { transliterateArmenianToLatin } from "./transliterate-hy";

export type GenerateSlugInput = {
  titleHy: string;
  woocommerceId: number;
  /** Force suffix even when base appears free (legacy / tests). */
  conflictWithOtherSku?: boolean;
};

export type GenerateSlugResult = {
  slug: string;
  baseSlug: string;
  fallbackUsed: boolean;
  conflictSuffixApplied: boolean;
};

/** Builds the base ASCII product slug (no collision suffix). */
export function generateBaseProductSlug(input: {
  titleHy: string;
  woocommerceId: number;
}): { baseSlug: string; fallbackUsed: boolean } {
  const transliterated = transliterateArmenianToLatin(input.titleHy);
  let baseSlug = normalizeProductSlug(transliterated);
  let fallbackUsed = false;

  if (!baseSlug || !isValidProductSlug(baseSlug)) {
    baseSlug = `product-${input.woocommerceId}`;
    fallbackUsed = true;
  }

  return { baseSlug, fallbackUsed };
}

/** Builds a deterministic ASCII product slug from an Armenian title. */
export function generateProductSlug(
  input: GenerateSlugInput,
): GenerateSlugResult {
  const { baseSlug, fallbackUsed } = generateBaseProductSlug(input);
  let slug = baseSlug;
  let conflictSuffixApplied = false;

  if (input.conflictWithOtherSku) {
    slug = normalizeProductSlug(`${baseSlug}-${input.woocommerceId}`);
    conflictSuffixApplied = true;
  }

  if (!isValidProductSlug(slug)) {
    return {
      slug: `product-${input.woocommerceId}`,
      baseSlug,
      fallbackUsed: true,
      conflictSuffixApplied,
    };
  }

  return { slug, baseSlug, fallbackUsed, conflictSuffixApplied };
}

export type SlugOwner = {
  sku: string;
  woocommerceId?: number;
};

/**
 * Reserves final product slugs so CSV-local and DB collisions are resolved
 * deterministically during a single import run.
 */
export class SlugReservationRegistry {
  private readonly reserved = new Map<string, SlugOwner>();

  /** Seeds reservations from existing DB products (any populated locale slug). */
  seedExisting(owners: Array<{ slug: string; sku: string }>): void {
    for (const owner of owners) {
      const slug = normalizeProductSlug(owner.slug);
      if (!slug) continue;
      const current = this.reserved.get(slug);
      if (!current) {
        this.reserved.set(slug, { sku: owner.sku });
      }
    }
  }

  isReservedByOther(slug: string, sku: string): boolean {
    const owner = this.reserved.get(normalizeProductSlug(slug));
    return Boolean(owner && owner.sku !== sku);
  }

  getOwner(slug: string): SlugOwner | undefined {
    return this.reserved.get(normalizeProductSlug(slug));
  }

  /**
   * Allocates and immediately reserves a final unique slug for this SKU.
   * Same SKU re-claiming its own slug is allowed (idempotent re-runs).
   */
  allocate(input: {
    titleHy: string;
    woocommerceId: number;
    sku: string;
  }): GenerateSlugResult {
    const { baseSlug, fallbackUsed } = generateBaseProductSlug(input);
    const existingBase = this.reserved.get(baseSlug);

    let slug = baseSlug;
    let conflictSuffixApplied = false;

    if (existingBase && existingBase.sku !== input.sku) {
      slug = normalizeProductSlug(`${baseSlug}-${input.woocommerceId}`);
      conflictSuffixApplied = true;
    }

    if (!isValidProductSlug(slug)) {
      slug = `product-${input.woocommerceId}`;
      return {
        slug,
        baseSlug,
        fallbackUsed: true,
        conflictSuffixApplied,
      };
    }

    const existingFinal = this.reserved.get(slug);
    if (existingFinal && existingFinal.sku !== input.sku) {
      // Extremely unlikely: reserved suffix collision — still block via unique map owner.
      slug = normalizeProductSlug(`product-${input.woocommerceId}`);
      conflictSuffixApplied = true;
    }

    this.reserved.set(slug, {
      sku: input.sku,
      woocommerceId: input.woocommerceId,
    });

    return {
      slug,
      baseSlug,
      fallbackUsed: fallbackUsed || slug.startsWith("product-"),
      conflictSuffixApplied,
    };
  }

  /** Returns duplicate final slugs mapped to owner SKUs (should be empty after allocate). */
  findDuplicateFinalSlugs(products: Array<{ sku: string; slug: string }>): string[] {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const product of products) {
      const slug = normalizeProductSlug(product.slug);
      const previous = seen.get(slug);
      if (previous && previous !== product.sku) {
        dupes.push(slug);
      } else {
        seen.set(slug, product.sku);
      }
    }
    return [...new Set(dupes)];
  }
}
