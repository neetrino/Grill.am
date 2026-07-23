import "server-only";

import { isNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import { categories } from "@/db/schema";
import { expandCategoryIdsWithDescendants } from "@/features/categories/domain/expand-category-ids";

/**
 * Resolves selected category ids plus every descendant under those parents.
 */
export async function resolveCategorySubtreeIds(
  rootIds: readonly string[],
): Promise<string[]> {
  if (rootIds.length === 0) return [];

  const rows = await getDb()
    .select({
      id: categories.id,
      parentId: categories.parentId,
    })
    .from(categories)
    .where(isNull(categories.deletedAt));

  return expandCategoryIdsWithDescendants(rootIds, rows);
}
