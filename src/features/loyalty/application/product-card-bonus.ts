import "server-only";

import { resolveActiveFlatBonusByProductId } from "@/features/loyalty/application/product-bonus-board";
import { computeProductCardBonusEarnAmount } from "@/features/loyalty/domain/loyalty-math";

/**
 * Resolves per-product storefront bonus earn preview (AMD minor units).
 * Uses active flat product/category rules only (no global earn %).
 */
export async function resolveProductCardBonusEarnByProductId(
  products: ReadonlyArray<{ id: string; priceAmount: number }>,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (products.length === 0) {
    return result;
  }

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

  return result;
}
