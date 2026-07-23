"use server";

import { and, desc, eq, isNull, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import { withCatalogEnrichment } from "@/features/products/application/catalog-enrichment";
import {
  HEADER_SEARCH_RESULT_LIMIT,
  normalizeHeaderSearchQuery,
} from "@/features/products/domain/header-search-query";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { createDisplayPriceFormatter } from "@/lib/money/display-price";
import type { Currency } from "@/lib/money/currency";
import { isCurrency } from "@/lib/money/currency";
import { err, ok, type Result } from "@/lib/result";

export type HeaderSearchHit = {
  id: string;
  title: string;
  slug: string;
  href: string;
  imageUrl: string | null;
  priceFormatted: string;
  inStock: boolean;
};

/**
 * Typeahead product search for the storefront header popup.
 * Matches active catalog titles/slugs (locale + hy) and SKU.
 */
export async function searchHeaderProductsAction(
  localeInput: string,
  currencyInput: string,
  rawQuery: string,
): Promise<Result<HeaderSearchHit[]>> {
  if (!isLocale(localeInput)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }
  if (!isCurrency(currencyInput)) {
    return err("INVALID_CURRENCY", "Invalid currency.");
  }

  const locale = localeInput as Locale;
  const currency = currencyInput as Currency;
  const query = normalizeHeaderSearchQuery(rawQuery);

  if (!query) {
    return ok([]);
  }

  const pattern = `%${query}%`;
  const rows = await getDb()
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, "ACTIVE"),
        isNull(products.deletedAt),
        or(
          sql`${products.translations}->${locale}->>'title' ILIKE ${pattern}`,
          sql`${products.translations}->${locale}->>'slug' ILIKE ${pattern}`,
          sql`${products.translations}->'hy'->>'title' ILIKE ${pattern}`,
          sql`${products.translations}->'hy'->>'slug' ILIKE ${pattern}`,
          sql`${products.sku} ILIKE ${pattern}`,
        ),
      ),
    )
    .orderBy(desc(products.isFeatured), desc(products.createdAt))
    .limit(HEADER_SEARCH_RESULT_LIMIT);

  const enriched = await withCatalogEnrichment(rows, locale);
  const formatPrice = await createDisplayPriceFormatter(locale, currency);

  return ok(
    enriched.map((product) => ({
      id: product.id,
      title: product.translation.title,
      slug: product.translation.slug,
      href: `/${locale}/products/${product.translation.slug}`,
      imageUrl: product.imageUrl,
      priceFormatted: formatPrice(product.priceAmount).formatted,
      inStock: product.stockOnHand > 0,
    })),
  );
}
