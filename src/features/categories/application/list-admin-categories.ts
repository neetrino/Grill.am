import "server-only";

import { and, asc, eq, isNotNull, isNull, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  categories,
  mediaAssets,
  type LocaleTranslation,
  type TranslationsJson,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

export type AdminCategoryListItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  parentId: string | null;
  parentTitle: string | null;
  sortOrder: number;
  imageUrl: string | null;
  childCount: number;
  /** Full locale key → copy map (admin edits English only). */
  translations: TranslationsJson;
};

/**
 * Admin categories are English-only; fall back to hy for legacy rows
 * that were saved before English-only admin.
 */
function translationForAdmin(
  translations: (typeof categories.$inferSelect)["translations"],
): LocaleTranslation | null {
  return translations.en ?? translations.hy ?? translations.ru ?? null;
}

/** Lists non-deleted categories for the admin categories table. */
export async function listAdminCategories(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for call-site symmetry with locale-aware admin list queries
  _locale: Locale,
): Promise<AdminCategoryListItem[]> {
  const rows = await getDb()
    .select()
    .from(categories)
    .where(isNull(categories.deletedAt))
    .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

  const byId = new Map(rows.map((row) => [row.id, row]));
  const childCount = new Map<string, number>();
  for (const row of rows) {
    if (!row.parentId) continue;
    childCount.set(row.parentId, (childCount.get(row.parentId) ?? 0) + 1);
  }

  const images = new Map<string, string>();
  if (rows.length > 0) {
    const mediaRows = await getDb()
      .select({
        categoryId: mediaAssets.categoryId,
        objectKey: mediaAssets.objectKey,
      })
      .from(mediaAssets)
      .where(
        and(
          isNotNull(mediaAssets.categoryId),
          eq(mediaAssets.uploadStatus, "READY"),
          or(
            eq(mediaAssets.isPrimary, true),
            eq(mediaAssets.role, "PRIMARY"),
            eq(mediaAssets.role, "COVER"),
          ),
        ),
      );

    for (const media of mediaRows) {
      if (!media.categoryId || images.has(media.categoryId)) continue;
      if (!byId.has(media.categoryId)) continue;
      images.set(media.categoryId, mediaPublicUrl(media.objectKey));
    }
  }

  return rows.map((row) => {
    const translation = translationForAdmin(row.translations);
    const parent = row.parentId ? byId.get(row.parentId) : undefined;
    const parentTitle = parent
      ? (translationForAdmin(parent.translations)?.title ?? null)
      : null;

    return {
      id: row.id,
      title: translation?.title ?? "Untitled",
      slug: translation?.slug ?? "",
      status: row.status,
      parentId: row.parentId,
      parentTitle,
      sortOrder: row.sortOrder,
      imageUrl: images.get(row.id) ?? null,
      childCount: childCount.get(row.id) ?? 0,
      translations: row.translations,
    };
  });
}
