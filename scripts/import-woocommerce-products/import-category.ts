import { and, eq, isNull, max } from "drizzle-orm";

import { categories } from "@/db/schema";
import { createId } from "@/lib/id";

import {
  findExistingCategory,
  loadExistingCategories,
  type ExistingCategory,
} from "./conflicts";
import type { ImportDatabase } from "./db";
import type { CategoryMutationResult } from "./types";

export type UpsertCategoryResult = {
  id: string;
  title: string;
  mutation: CategoryMutationResult;
};

/** Idempotently creates or reuses a category by Armenian title / slug. */
export async function upsertImportCategory(
  db: ImportDatabase,
  title: string,
  slug: string,
  cache: ExistingCategory[],
): Promise<UpsertCategoryResult> {
  const existing = findExistingCategory(cache, title);
  if (existing) {
    return { id: existing.id, title, mutation: "reused" };
  }

  // Re-check DB in case another product created it earlier in this run.
  const fresh = await loadExistingCategories(db);
  const raced = findExistingCategory(fresh, title);
  if (raced) {
    cache.push(raced);
    return { id: raced.id, title, mutation: "reused" };
  }

  const [maxSort] = await db
    .select({ value: max(categories.sortOrder) })
    .from(categories)
    .where(isNull(categories.deletedAt));

  const id = createId();
  await db.insert(categories).values({
    id,
    parentId: null,
    translations: {
      hy: { title, slug },
    },
    sortOrder: (maxSort?.value ?? 0) + 1,
    status: "ACTIVE",
  });

  const created: ExistingCategory = {
    id,
    titleHy: title,
    slugHy: slug,
    titleEn: null,
    slugEn: null,
  };
  cache.push(created);

  return { id, title, mutation: "created" };
}

export async function resolveCategoryIdMap(
  db: ImportDatabase,
  titles: string[],
  slugByTitle: Map<string, string>,
): Promise<{
  idByTitle: Map<string, string>;
  created: number;
  reused: number;
}> {
  const cache = await loadExistingCategories(db);
  const idByTitle = new Map<string, string>();
  let created = 0;
  let reused = 0;

  for (const title of titles) {
    const slug = slugByTitle.get(title) ?? title;
    const result = await upsertImportCategory(db, title, slug, cache);
    idByTitle.set(title, result.id);
    if (result.mutation === "created") created += 1;
    else reused += 1;
  }

  return { idByTitle, created, reused };
}

export async function categoryExistsById(
  db: ImportDatabase,
  categoryId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .limit(1);
  return Boolean(row);
}
