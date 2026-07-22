import "server-only";

import { and, asc, eq, isNotNull, isNull, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import { categories, mediaAssets, type LocaleTranslation } from "@/db/schema";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

export type StorefrontCategory = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
};

const HOME_CATEGORIES_LIMIT = 8;

function translationFor(
  translations: (typeof categories.$inferSelect)["translations"],
  locale: Locale,
): LocaleTranslation | null {
  return translations[locale] ?? translations.hy ?? translations.en ?? null;
}

async function loadStorefrontCategories(
  locale: Locale,
): Promise<StorefrontCategory[]> {
  const rows = await getDb()
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.status, "ACTIVE"),
        isNull(categories.deletedAt),
        isNull(categories.parentId),
      ),
    )
    .orderBy(asc(categories.sortOrder), asc(categories.createdAt))
    .limit(HOME_CATEGORIES_LIMIT);

  if (rows.length === 0) {
    return [];
  }

  const categoryIds = new Set(rows.map((row) => row.id));
  const images = new Map<string, string>();
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
    if (!categoryIds.has(media.categoryId)) continue;
    images.set(media.categoryId, mediaPublicUrl(media.objectKey));
  }

  return rows.flatMap((row) => {
    const translation = translationFor(row.translations, locale);
    if (!translation?.slug) {
      return [];
    }

    return [
      {
        id: row.id,
        title: translation.title,
        slug: translation.slug,
        imageUrl: images.get(row.id) ?? null,
      },
    ];
  });
}

/** Active root categories for the storefront home showcase (tag-cached). */
export async function listStorefrontCategories(
  locale: Locale,
): Promise<StorefrontCategory[]> {
  return unstable_cache(
    async () => loadStorefrontCategories(locale),
    ["storefront-categories", locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}
