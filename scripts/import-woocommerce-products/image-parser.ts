import { createHash } from "node:crypto";

export type ParsedImages = {
  urls: string[];
  duplicatesRemoved: number;
};

/** Normalizes a remote image URL for hashing and dedupe. */
export function normalizeImageSourceUrl(url: string): string {
  return url.trim();
}

/** Stable short hash of a normalized source URL. */
export function hashImageSourceUrl(url: string): string {
  return createHash("sha256")
    .update(normalizeImageSourceUrl(url))
    .digest("hex")
    .slice(0, 12);
}

/**
 * Parses WooCommerce image lists (comma-separated absolute URLs).
 * Trims, drops empties, and removes duplicate URLs while preserving order.
 */
export function parseProductImageUrls(raw: string): ParsedImages {
  const value = raw.trim();
  if (!value) {
    return { urls: [], duplicatesRemoved: 0 };
  }

  const seen = new Set<string>();
  const urls: string[] = [];
  let duplicatesRemoved = 0;

  for (const part of value.split(",")) {
    const url = normalizeImageSourceUrl(part);
    if (!url) continue;
    if (seen.has(url)) {
      duplicatesRemoved += 1;
      continue;
    }
    seen.add(url);
    urls.push(url);
  }

  return { urls, duplicatesRemoved };
}

/** Deterministic R2 object key for a WooCommerce product image. */
export function buildProductImageObjectKey(input: {
  productId: string;
  woocommerceId: number;
  index: number;
  sourceUrl: string;
  extension: string;
}): string {
  const hash = hashImageSourceUrl(input.sourceUrl);
  const ext = input.extension.replace(/^\./, "");
  return `uploads/products/${input.productId}/woocommerce-${input.woocommerceId}-${input.index}-${hash}.${ext}`;
}

/** Template key used in dry-run reports before a product UUID exists. */
export function buildPlannedImageObjectKeyTemplate(input: {
  woocommerceId: number;
  index: number;
  sourceUrl: string;
}): string {
  const hash = hashImageSourceUrl(input.sourceUrl);
  return `uploads/products/{productId}/woocommerce-${input.woocommerceId}-${input.index}-${hash}.{ext}`;
}
