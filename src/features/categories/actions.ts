"use server";

import { and, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db/client";
import { categories, type TranslationsJson } from "@/db/schema";
import { persistCategoryImage, removeCategoryImage } from "@/features/categories/application/persist-category-media";
import {
  hasCategoryLocaleCopy,
  mergeCategoryTranslations,
} from "@/features/categories/domain/merge-category-translations";
import { requireAdmin } from "@/lib/auth/policies";
import { invalidateProductsCache } from "@/lib/cache/invalidate-public";
import { createId } from "@/lib/id";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

const categoryLocaleCopySchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
});

const createCategorySchema = z.object({
  editingLocale: z.enum(locales),
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  parentId: z.string().uuid().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

const drawerCategorySchema = z.object({
  localeCopies: z.object({
    hy: categoryLocaleCopySchema.optional(),
    en: categoryLocaleCopySchema.optional(),
    ru: categoryLocaleCopySchema.optional(),
  }),
  parentId: z.string().uuid().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type DrawerCategoryInput = z.infer<typeof drawerCategorySchema>;

function mergeTranslations(
  existing: TranslationsJson | null | undefined,
  editingLocale: Locale,
  title: string,
  slug: string,
): TranslationsJson {
  return {
    ...(existing ?? {}),
    [editingLocale]: { title, slug },
  };
}

function revalidateCategories(): void {
  for (const loc of locales) {
    revalidatePath(`/${loc}/admin/categories`);
    revalidatePath(`/${loc}/admin/products`);
    revalidatePath(`/${loc}/products`);
    revalidatePath(`/${loc}`);
  }
  invalidateProductsCache({ allProductDetails: true });
}

function parseDrawerCategoryForm(
  formData: FormData,
): DrawerCategoryInput | null {
  const raw = formData.get("data");
  if (typeof raw !== "string") {
    return null;
  }
  try {
    const parsed = drawerCategorySchema.safeParse(JSON.parse(raw));
    if (!parsed.success || !hasCategoryLocaleCopy(parsed.data.localeCopies)) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

async function insertCategoryRow(data: {
  parentId: string | null;
  status: "ACTIVE" | "ARCHIVED";
  translations: TranslationsJson;
}): Promise<Result<{ id: string }>> {
  if (data.parentId) {
    const [parent] = await getDb()
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, data.parentId),
          isNull(categories.deletedAt),
        ),
      )
      .limit(1);
    if (!parent) {
      return err("NOT_FOUND", "Parent category not found.");
    }
  }

  const [maxSort] = await getDb()
    .select({ value: max(categories.sortOrder) })
    .from(categories)
    .where(isNull(categories.deletedAt));

  const id = createId();
  await getDb().insert(categories).values({
    id,
    parentId: data.parentId,
    translations: data.translations,
    sortOrder: (maxSort?.value ?? 0) + 1,
    status: data.status,
  });

  revalidateCategories();
  return ok({ id });
}

async function persistDrawerImage(
  categoryId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const image = formData.get("image");
  const removeImage = formData.get("removeImage") === "1";

  if (image instanceof File && image.size > 0) {
    const mediaResult = await persistCategoryImage(categoryId, image);
    if (mediaResult.error) {
      return err("VALIDATION_ERROR", mediaResult.error);
    }
    revalidateCategories();
    return ok({ id: categoryId });
  }

  if (removeImage) {
    await removeCategoryImage(categoryId);
    revalidateCategories();
  }

  return ok({ id: categoryId });
}

/** Creates a category for the admin catalog. */
export async function createCategoryAction(
  locale: string,
  raw: CreateCategoryInput,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = createCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid category payload.");
  }

  await requireAdmin(locale as Locale);
  return insertCategoryRow({
    parentId: parsed.data.parentId,
    status: parsed.data.status,
    translations: mergeTranslations(
      null,
      parsed.data.editingLocale,
      parsed.data.title,
      parsed.data.slug,
    ),
  });
}

/** Creates a category from the admin drawer (all locales + optional image). */
export async function createCategoryFromDrawerAction(
  locale: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = parseDrawerCategoryForm(formData);
  if (!parsed) {
    return err("VALIDATION_ERROR", "Invalid category payload.");
  }

  await requireAdmin(locale as Locale);
  const created = await insertCategoryRow({
    parentId: parsed.parentId,
    status: parsed.status,
    translations: mergeCategoryTranslations(null, parsed.localeCopies),
  });
  if (!created.ok) return created;

  const media = await persistDrawerImage(created.value.id, formData);
  if (!media.ok) return media;
  return created;
}

/** Updates a category from the admin drawer (all locales + optional image). */
export async function updateCategoryFromDrawerAction(
  locale: string,
  categoryId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = parseDrawerCategoryForm(formData);
  if (!parsed) {
    return err("VALIDATION_ERROR", "Invalid category payload.");
  }

  if (parsed.parentId === categoryId) {
    return err("VALIDATION_ERROR", "A category cannot be its own parent.");
  }

  await requireAdmin(locale as Locale);

  const [existing] = await getDb()
    .select({ id: categories.id, translations: categories.translations })
    .from(categories)
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .limit(1);

  if (!existing) {
    return err("NOT_FOUND", "Category not found.");
  }

  if (parsed.parentId) {
    const [parent] = await getDb()
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, parsed.parentId),
          isNull(categories.deletedAt),
        ),
      )
      .limit(1);
    if (!parent) {
      return err("NOT_FOUND", "Parent category not found.");
    }
  }

  await getDb()
    .update(categories)
    .set({
      parentId: parsed.parentId,
      translations: mergeCategoryTranslations(
        existing.translations,
        parsed.localeCopies,
      ),
      status: parsed.status,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, existing.id));

  const media = await persistDrawerImage(existing.id, formData);
  if (!media.ok) return media;
  revalidateCategories();
  return ok({ id: existing.id });
}

/** Soft-deletes a category. */
export async function deleteCategoryAction(
  locale: string,
  categoryId: string,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  await requireAdmin(locale as Locale);

  const [updated] = await getDb()
    .update(categories)
    .set({
      deletedAt: new Date(),
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .returning({ id: categories.id });

  if (!updated) {
    return err("NOT_FOUND", "Category not found.");
  }

  revalidateCategories();
  return ok({ id: updated.id });
}

const reorderCategoriesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

/** Persists admin category table order via sortOrder (1-based). */
export async function reorderCategoriesAction(
  locale: string,
  raw: z.infer<typeof reorderCategoriesSchema>,
): Promise<Result<{ updated: number }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = reorderCategoriesSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid category order.");
  }

  await requireAdmin(locale as Locale);

  const uniqueIds = [...new Set(parsed.data.orderedIds)];
  if (uniqueIds.length !== parsed.data.orderedIds.length) {
    return err("VALIDATION_ERROR", "Duplicate category ids in order.");
  }

  const existing = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(and(isNull(categories.deletedAt)));

  if (existing.length !== uniqueIds.length) {
    return err(
      "VALIDATION_ERROR",
      "Category list is out of date. Refresh and try again.",
    );
  }

  const existingSet = new Set(existing.map((row) => row.id));
  for (const id of uniqueIds) {
    if (!existingSet.has(id)) {
      return err("NOT_FOUND", "Category not found.");
    }
  }

  const now = new Date();
  await Promise.all(
    uniqueIds.map((id, index) =>
      getDb()
        .update(categories)
        .set({ sortOrder: index + 1, updatedAt: now })
        .where(eq(categories.id, id)),
    ),
  );

  revalidateCategories();
  return ok({ updated: uniqueIds.length });
}
