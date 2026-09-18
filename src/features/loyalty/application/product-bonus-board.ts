import "server-only";

import { and, asc, eq, inArray, isNotNull, isNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  categoryBonusRules,
  mediaAssets,
  productBonusRules,
  productCategories,
  products,
} from "@/db/schema";
import { listAdminCategories } from "@/features/categories/application/list-admin-categories";
import {
  isProductBonusRuleActive,
  pickFlatBonusAmount,
  type ProductBonusRuleWindow,
} from "@/features/loyalty/domain/loyalty-math";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

export type ProductBonusBoardRow = {
  id: string;
  title: string;
  slug: string;
  sku: string;
  priceAmount: number;
  imageUrl: string | null;
  bonusAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type CategoryBonusBoardRow = {
  id: string;
  title: string;
  parentLabel: string;
  imageUrl: string | null;
  bonusAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
};

/** Loads admin product rows with optional flat bonus rules. */
export async function getAdminProductBonusBoard(
  locale: Locale,
): Promise<ProductBonusBoardRow[]> {
  const [productRows, ruleRows, imageRows] = await Promise.all([
    getDb()
      .select({
        id: products.id,
        sku: products.sku,
        priceAmount: products.priceAmount,
        translations: products.translations,
      })
      .from(products)
      .where(isNull(products.deletedAt))
      .orderBy(asc(products.sku))
      .limit(300),
    getDb()
      .select({
        productId: productBonusRules.productId,
        amount: productBonusRules.amount,
        startsAt: productBonusRules.startsAt,
        endsAt: productBonusRules.endsAt,
      })
      .from(productBonusRules),
    getDb()
      .select({
        productId: mediaAssets.productId,
        objectKey: mediaAssets.objectKey,
      })
      .from(mediaAssets)
      .where(
        and(
          isNotNull(mediaAssets.productId),
          eq(mediaAssets.uploadStatus, "READY"),
          eq(mediaAssets.isPrimary, true),
        ),
      ),
  ]);

  const rules = new Map(
    ruleRows.map((row) => [
      row.productId,
      {
        amount: row.amount,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      },
    ]),
  );

  const images = new Map<string, string>();
  for (const row of imageRows) {
    if (!row.productId || images.has(row.productId)) continue;
    images.set(row.productId, mediaPublicUrl(row.objectKey));
  }

  return productRows.map((product) => {
    const translation =
      product.translations[locale] ??
      product.translations.hy ??
      product.translations.en;
    const rule = rules.get(product.id);
    return {
      id: product.id,
      title: translation?.title ?? product.sku,
      slug: translation?.slug ?? "",
      sku: product.sku,
      priceAmount: product.priceAmount,
      imageUrl: images.get(product.id) ?? null,
      bonusAmount: rule?.amount ?? null,
      startsAt: rule?.startsAt?.toISOString() ?? null,
      endsAt: rule?.endsAt?.toISOString() ?? null,
    };
  });
}

/** Loads admin category rows with optional flat bonus rules. */
export async function getAdminCategoryBonusBoard(
  locale: Locale,
): Promise<CategoryBonusBoardRow[]> {
  const [categoryRows, ruleRows] = await Promise.all([
    listAdminCategories(locale),
    getDb()
      .select({
        categoryId: categoryBonusRules.categoryId,
        amount: categoryBonusRules.amount,
        startsAt: categoryBonusRules.startsAt,
        endsAt: categoryBonusRules.endsAt,
      })
      .from(categoryBonusRules),
  ]);

  const rules = new Map(
    ruleRows.map((row) => [
      row.categoryId,
      {
        amount: row.amount,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      },
    ]),
  );

  return categoryRows.map((category) => {
    const rule = rules.get(category.id);
    return {
      id: category.id,
      title: category.title,
      parentLabel: category.parentTitle ?? "Root",
      imageUrl: category.imageUrl,
      bonusAmount: rule?.amount ?? null,
      startsAt: rule?.startsAt?.toISOString() ?? null,
      endsAt: rule?.endsAt?.toISOString() ?? null,
    };
  });
}

function toActiveAmount(
  rule: ProductBonusRuleWindow | undefined,
  now: Date,
): number | null {
  if (!rule || !isProductBonusRuleActive(rule, now)) {
    return null;
  }
  return rule.amount > 0 ? rule.amount : null;
}

/**
 * Resolves effective flat AMD bonus per product at `now`.
 * Precedence: product rule > best (max) active category rule.
 */
export async function resolveActiveFlatBonusByProductId(
  productIds: string[],
  now: Date = new Date(),
): Promise<Map<string, number>> {
  const unique = [...new Set(productIds.filter(Boolean))];
  const result = new Map<string, number>();
  if (unique.length === 0) {
    return result;
  }

  const [productRows, categoryLinks, categoryRows] = await Promise.all([
    getDb()
      .select({
        productId: productBonusRules.productId,
        amount: productBonusRules.amount,
        startsAt: productBonusRules.startsAt,
        endsAt: productBonusRules.endsAt,
      })
      .from(productBonusRules)
      .where(inArray(productBonusRules.productId, unique)),
    getDb()
      .select({
        productId: productCategories.productId,
        categoryId: productCategories.categoryId,
      })
      .from(productCategories)
      .where(inArray(productCategories.productId, unique)),
    getDb()
      .select({
        categoryId: categoryBonusRules.categoryId,
        amount: categoryBonusRules.amount,
        startsAt: categoryBonusRules.startsAt,
        endsAt: categoryBonusRules.endsAt,
      })
      .from(categoryBonusRules),
  ]);

  const productAmount = new Map<string, number | null>();
  for (const row of productRows) {
    productAmount.set(
      row.productId,
      toActiveAmount(
        {
          amount: row.amount,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
        },
        now,
      ),
    );
  }

  const categoryAmount = new Map<string, number | null>();
  for (const row of categoryRows) {
    categoryAmount.set(
      row.categoryId,
      toActiveAmount(
        {
          amount: row.amount,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
        },
        now,
      ),
    );
  }

  const categoriesByProduct = new Map<string, string[]>();
  for (const link of categoryLinks) {
    const list = categoriesByProduct.get(link.productId) ?? [];
    list.push(link.categoryId);
    categoriesByProduct.set(link.productId, list);
  }

  for (const productId of unique) {
    const picked = pickFlatBonusAmount({
      productAmount: productAmount.get(productId) ?? null,
      categoryAmounts: (categoriesByProduct.get(productId) ?? []).map(
        (categoryId) => categoryAmount.get(categoryId) ?? null,
      ),
    });
    if (picked != null) {
      result.set(productId, picked);
    }
  }

  return result;
}

/** @deprecated Prefer resolveActiveFlatBonusByProductId (includes categories). */
export async function getActiveProductBonusRules(
  productIds: string[],
  now: Date = new Date(),
): Promise<Map<string, ProductBonusRuleWindow>> {
  const amounts = await resolveActiveFlatBonusByProductId(productIds, now);
  return new Map(
    [...amounts.entries()].map(([productId, amount]) => [
      productId,
      { amount, startsAt: null, endsAt: null },
    ]),
  );
}
