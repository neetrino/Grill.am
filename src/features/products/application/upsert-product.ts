"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db/client";
import {
  categories,
  productCategories,
  products,
  stockMovements,
  type LocaleTranslation,
  type TranslationsJson,
} from "@/db/schema";
import {
  assertProductIdentityAvailable,
  mapProductUniqueViolation,
} from "@/features/products/application/product-identity";
import { persistProductMedia } from "@/features/products/application/persist-product-media";
import { syncCustomizationToModifierCatalog } from "@/features/products/application/modifier-catalog";
import {
  productCustomizationSchema,
  type ProductCustomization,
} from "@/features/products/domain/customization";
import {
  isValidProductSlug,
  normalizeProductSlug,
  withSharedProductSlug,
} from "@/features/products/domain/product-slug";
import { requireAdmin } from "@/lib/auth/policies";
import { invalidateProductsCache } from "@/lib/cache/invalidate-public";
import { createId } from "@/lib/id";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

const localeCopySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  composition: z.string().trim().max(2000).optional(),
});

const productUpsertSchema = z.object({
  editingLocale: z.enum(locales),
  sku: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(200),
  /** All locale drafts filled in the drawer (shared slug applied server-side). */
  localeCopies: z
    .object({
      hy: localeCopySchema.optional(),
      en: localeCopySchema.optional(),
      ru: localeCopySchema.optional(),
    })
    .refine(
      (value) =>
        Boolean(value.hy?.title || value.en?.title || value.ru?.title),
      { message: "At least one locale title is required." },
    ),
  customization: productCustomizationSchema.optional(),
  priceAmount: z.number().int().nonnegative(),
  compareAtAmount: z.number().int().nonnegative().nullable(),
  stockOnHand: z.number().int().nonnegative(),
  categoryIds: z.array(z.string().uuid()),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  primaryExistingId: z.string().uuid().nullable(),
  primaryNewIndex: z.number().int().nullable(),
  removeImageIds: z.array(z.string().uuid()),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;

/** Merges every filled locale draft, then syncs one shared slug across all locales. */
function mergeTranslations(
  existing: TranslationsJson | null | undefined,
  data: ProductUpsertInput,
): TranslationsJson | null {
  const slug = normalizeProductSlug(data.slug);
  if (!slug || !isValidProductSlug(slug)) {
    return null;
  }

  const merged: TranslationsJson = { ...(existing ?? {}) };
  for (const loc of locales) {
    const copy = data.localeCopies[loc];
    if (!copy) continue;
    merged[loc] = {
      title: copy.title,
      slug,
      description: copy.description || undefined,
      shortDescription: copy.shortDescription || undefined,
      composition: copy.composition || undefined,
    } satisfies LocaleTranslation;
  }

  return withSharedProductSlug(merged, slug);
}

function normalizeCustomization(
  value: ProductCustomization | undefined,
): ProductCustomization | null {
  if (!value) return null;
  if (
    value.optionGroups.length === 0 &&
    value.addons.length === 0 &&
    value.exclusions.length === 0
  ) {
    return null;
  }
  return value;
}

function revalidateProducts(
  locale: string,
  product: { id: string; slug: string; previousSlug?: string },
): void {
  revalidatePath(`/${locale}/admin/products`);
  revalidatePath(`/${locale}/products`);
  for (const loc of locales) {
    revalidatePath(`/${loc}`);
  }
  invalidateProductsCache({
    productId: product.id,
    slug: product.slug,
  });
  if (product.previousSlug && product.previousSlug !== product.slug) {
    invalidateProductsCache({ slug: product.previousSlug });
  }
}

function parsePayload(formData: FormData): ProductUpsertInput | null {
  const raw = formData.get("data");
  if (typeof raw !== "string") return null;
  try {
    return productUpsertSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

function collectImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function syncProductCategories(
  productId: string,
  categoryIds: string[],
): Promise<string | null> {
  const uniqueIds = [...new Set(categoryIds)];
  if (uniqueIds.length > 0) {
    const found = await getDb()
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          inArray(categories.id, uniqueIds),
          isNull(categories.deletedAt),
        ),
      );
    if (found.length !== uniqueIds.length) {
      return "One or more categories were not found.";
    }
  }

  await getDb()
    .delete(productCategories)
    .where(eq(productCategories.productId, productId));

  if (uniqueIds.length === 0) return null;

  await getDb().insert(productCategories).values(
    uniqueIds.map((categoryId, index) => ({
      id: createId(),
      productId,
      categoryId,
      isPrimary: index === 0,
      sortOrder: index,
    })),
  );

  return null;
}

/** Creates a product from the admin drawer (fields + optional images). */
export async function createProductFromDrawerAction(
  locale: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const data = parsePayload(formData);
  if (!data) {
    return err("VALIDATION_ERROR", "Invalid product payload.");
  }

  if (
    data.compareAtAmount != null &&
    data.compareAtAmount < data.priceAmount
  ) {
    return err(
      "VALIDATION_ERROR",
      "Compare-at price must be greater than or equal to price.",
    );
  }

  const actor = await requireAdmin(locale as Locale);
  const id = createId();
  const files = collectImageFiles(formData);
  const translations = mergeTranslations(null, data);
  if (!translations) {
    return err(
      "VALIDATION_ERROR",
      "Slug must use lowercase letters, numbers, and hyphens.",
    );
  }
  const slug = normalizeProductSlug(data.slug);

  const identityConflict = await assertProductIdentityAvailable(
    data.sku,
    slug,
  );
  if (identityConflict) {
    return identityConflict;
  }

  try {
    await getDb().insert(products).values({
      id,
      sku: data.sku,
      priceAmount: data.priceAmount,
      compareAtAmount: data.compareAtAmount,
      stockOnHand: data.stockOnHand,
      status: data.status,
      translations,
      customization: normalizeCustomization(data.customization),
    });
  } catch (error) {
    const conflict = mapProductUniqueViolation(error);
    if (conflict) {
      return conflict;
    }
    throw error;
  }

  await syncCustomizationToModifierCatalog(
    normalizeCustomization(data.customization),
  );

  const categoryError = await syncProductCategories(id, data.categoryIds);
  if (categoryError) {
    return err("VALIDATION_ERROR", categoryError);
  }

  if (data.stockOnHand > 0) {
    await getDb().insert(stockMovements).values({
      id: createId(),
      productId: id,
      delta: data.stockOnHand,
      reason: "ADMIN_ADJUSTMENT",
      actorUserId: actor.id,
      resultingBalance: data.stockOnHand,
    });
  }

  const mediaResult = await persistProductMedia({
    productId: id,
    files,
    primaryNewIndex: data.primaryNewIndex ?? (files.length > 0 ? 0 : null),
    primaryExistingId: null,
    removeImageIds: [],
  });
  if (mediaResult.error) {
    return err("VALIDATION_ERROR", mediaResult.error);
  }

  revalidateProducts(locale, { id, slug });
  return ok({ id });
}

/** Updates a product from the admin drawer (fields + optional images). */
export async function updateProductFromDrawerAction(
  locale: string,
  productId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const data = parsePayload(formData);
  if (!data) {
    return err("VALIDATION_ERROR", "Invalid product payload.");
  }

  if (
    data.compareAtAmount != null &&
    data.compareAtAmount < data.priceAmount
  ) {
    return err(
      "VALIDATION_ERROR",
      "Compare-at price must be greater than or equal to price.",
    );
  }

  const actor = await requireAdmin(locale as Locale);
  const files = collectImageFiles(formData);

  const [existing] = await getDb()
    .select({
      id: products.id,
      stockOnHand: products.stockOnHand,
      status: products.status,
      translations: products.translations,
    })
    .from(products)
    .where(and(eq(products.id, productId), isNull(products.deletedAt)))
    .limit(1);

  if (!existing) {
    return err("NOT_FOUND", "Product not found.");
  }

  const translations = mergeTranslations(existing.translations, data);
  if (!translations) {
    return err(
      "VALIDATION_ERROR",
      "Slug must use lowercase letters, numbers, and hyphens.",
    );
  }
  const slug = normalizeProductSlug(data.slug);

  const identityConflict = await assertProductIdentityAvailable(
    data.sku,
    slug,
    existing.id,
  );
  if (identityConflict) {
    return identityConflict;
  }

  try {
    await getDb()
      .update(products)
      .set({
        sku: data.sku,
        priceAmount: data.priceAmount,
        compareAtAmount: data.compareAtAmount,
        stockOnHand: data.stockOnHand,
        status: data.status || existing.status,
        translations,
        customization: normalizeCustomization(data.customization),
        updatedAt: new Date(),
      })
      .where(eq(products.id, existing.id));
  } catch (error) {
    const conflict = mapProductUniqueViolation(error);
    if (conflict) {
      return conflict;
    }
    throw error;
  }

  await syncCustomizationToModifierCatalog(
    normalizeCustomization(data.customization),
  );

  const categoryError = await syncProductCategories(
    existing.id,
    data.categoryIds,
  );
  if (categoryError) {
    return err("VALIDATION_ERROR", categoryError);
  }

  const delta = data.stockOnHand - existing.stockOnHand;
  if (delta !== 0) {
    await getDb().insert(stockMovements).values({
      id: createId(),
      productId: existing.id,
      delta,
      reason: "ADMIN_ADJUSTMENT",
      actorUserId: actor.id,
      resultingBalance: data.stockOnHand,
    });
  }

  const mediaResult = await persistProductMedia({
    productId: existing.id,
    files,
    primaryNewIndex: data.primaryNewIndex ?? null,
    primaryExistingId: data.primaryExistingId ?? null,
    removeImageIds: data.removeImageIds,
  });
  if (mediaResult.error) {
    return err("VALIDATION_ERROR", mediaResult.error);
  }

  const previousSlug =
    existing.translations.hy?.slug ??
    existing.translations.en?.slug ??
    existing.translations.ru?.slug;

  revalidateProducts(locale, {
    id: existing.id,
    slug,
    previousSlug,
  });
  return ok({ id: existing.id });
}
