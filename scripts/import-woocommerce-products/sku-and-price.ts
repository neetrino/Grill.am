import { EXCLUDED_WOOCOMMERCE_ID, SKU_PREFIX } from "./constants";

/** Builds the deterministic WooCommerce import SKU. */
export function generateSku(woocommerceId: number): string {
  return `${SKU_PREFIX}${woocommerceId}`;
}

/** Parses WooCommerce numeric ID from a CSV cell. */
export function parseWooCommerceId(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}

export function isExcludedWooCommerceId(id: number): boolean {
  return id === EXCLUDED_WOOCOMMERCE_ID;
}

/** Parses integer AMD price; rejects decimals, negatives, empty, malformed. */
export function parseIntegerAmdPrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 0) return null;
  return value;
}

/** Maps WooCommerce published flag to grill.am product status. */
export function mapPublishedStatus(raw: string): "ACTIVE" | "DRAFT" {
  return raw.trim() === "1" ? "ACTIVE" : "DRAFT";
}

/** Maps WooCommerce featured flag. */
export function mapFeaturedFlag(raw: string): boolean {
  return raw.trim() === "1";
}

export function stockCorrelationId(sku: string): string {
  return `wc-import:${sku}`;
}
