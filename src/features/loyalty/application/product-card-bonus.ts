import "server-only";

import { unstable_cache } from "next/cache";

import { resolveActiveFlatBonusByProductId } from "@/features/loyalty/application/product-bonus-board";
import { computeProductCardBonusEarnAmount } from "@/features/loyalty/domain/loyalty-math";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";

type ProductCardBonusInput = ReadonlyArray<{
  id: string;
  priceAmount: number;
}>;

async function loadProductCardBonusEarnEntries(
  products: ProductCardBonusInput,
): Promise<Array<[string, number]>> {
  const result = new Map<string, number>();
  const flatByProductId = await resolveActiveFlatBonusByProductId(
    products.map((product) => product.id),
  );

  for (const product of products) {
    const amount = computeProductCardBonusEarnAmount({
      priceAmount: product.priceAmount,
      earnPercent: 0,
      flatBonusAmount: flatByProductId.get(product.id) ?? null,
    });
    if (amount > 0) {
      result.set(product.id, amount);
    }
  }

  return [...result.entries()];
}

/**
 * Resolves per-product storefront bonus earn preview (AMD minor units).
 * Uses active flat product/category rules only (no global earn %).
 * Cached so ISR PDP HTML never hits uncached Neon `fetch`.
 */
export async function resolveProductCardBonusEarnByProductId(
  products: ProductCardBonusInput,
): Promise<Map<string, number>> {
  if (products.length === 0) {
    return new Map();
  }

  const cacheKey = products
    .map((product) => `${product.id}:${product.priceAmount}`)
    .sort()
    .join(",");

  const entries = await unstable_cache(
    async () => loadProductCardBonusEarnEntries(products),
    ["product-card-bonus-earn", cacheKey],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();

  return new Map(entries);
}
