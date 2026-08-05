import { and, eq, isNull } from "drizzle-orm";

import { productCategories, products, type TranslationsJson } from "@/db/schema";
import { withSharedProductSlug } from "@/features/products/domain/product-slug";
import { createId } from "@/lib/id";

import type { ImportDatabase } from "./db";
import type { NormalizedProductRow, ProductMutationResult } from "./types";

function buildTranslations(product: NormalizedProductRow): TranslationsJson {
  return withSharedProductSlug(
    {
      hy: {
        title: product.titleHy,
        slug: product.slug,
        description: product.descriptionHy ?? undefined,
        shortDescription: product.shortDescriptionHy ?? undefined,
        seoDescription: product.seoDescriptionHy ?? undefined,
      },
    },
    product.slug,
  );
}

function productNeedsUpdate(
  existing: {
    priceAmount: number;
    status: string;
    isFeatured: boolean;
    translations: TranslationsJson;
  },
  product: NormalizedProductRow,
): boolean {
  const hy = existing.translations.hy;
  if (existing.priceAmount !== product.priceAmount) return true;
  if (existing.status !== product.status) return true;
  if (existing.isFeatured !== product.isFeatured) return true;
  if (!hy) return true;
  if (hy.title !== product.titleHy) return true;
  if (hy.slug !== product.slug) return true;
  if ((hy.description ?? null) !== product.descriptionHy) return true;
  if ((hy.shortDescription ?? null) !== product.shortDescriptionHy) return true;
  if ((hy.seoDescription ?? null) !== product.seoDescriptionHy) return true;
  return false;
}

export type UpsertProductResult = {
  productId: string;
  mutation: ProductMutationResult;
  previousStockOnHand: number;
};

/** Creates or updates a product keyed by WC-{id} SKU. */
export async function upsertImportProduct(
  db: ImportDatabase,
  product: NormalizedProductRow,
): Promise<UpsertProductResult> {
  const [existing] = await db
    .select({
      id: products.id,
      priceAmount: products.priceAmount,
      status: products.status,
      isFeatured: products.isFeatured,
      stockOnHand: products.stockOnHand,
      translations: products.translations,
    })
    .from(products)
    .where(and(eq(products.sku, product.sku), isNull(products.deletedAt)))
    .limit(1);

  const translations = buildTranslations(product);

  if (!existing) {
    const id = createId();
    await db.insert(products).values({
      id,
      sku: product.sku,
      translations,
      priceAmount: product.priceAmount,
      compareAtAmount: null,
      stockOnHand: 0,
      status: product.status,
      isFeatured: product.isFeatured,
    });
    return {
      productId: id,
      mutation: "created",
      previousStockOnHand: 0,
    };
  }

  if (!productNeedsUpdate(existing, product)) {
    return {
      productId: existing.id,
      mutation: "unchanged",
      previousStockOnHand: existing.stockOnHand,
    };
  }

  await db
    .update(products)
    .set({
      translations,
      priceAmount: product.priceAmount,
      compareAtAmount: null,
      status: product.status,
      isFeatured: product.isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(products.id, existing.id));

  return {
    productId: existing.id,
    mutation: "updated",
    previousStockOnHand: existing.stockOnHand,
  };
}

/** Replaces product↔category links; first category is primary. */
export async function syncImportProductCategories(
  db: ImportDatabase,
  productId: string,
  categoryIds: string[],
): Promise<number> {
  await db
    .delete(productCategories)
    .where(eq(productCategories.productId, productId));

  if (categoryIds.length === 0) return 0;

  await db.insert(productCategories).values(
    categoryIds.map((categoryId, index) => ({
      id: createId(),
      productId,
      categoryId,
      isPrimary: index === 0,
      sortOrder: index,
    })),
  );

  return categoryIds.length;
}
