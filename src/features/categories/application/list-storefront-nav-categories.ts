import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import { categories, type LocaleTranslation } from "@/db/schema";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";
import type { StorefrontNavCategory } from "@/features/categories/storefront-nav-category";

export type { StorefrontNavCategory };

function translationFor(
  translations: (typeof categories.$inferSelect)["translations"],
  locale: Locale,
): LocaleTranslation | null {
  return translations[locale] ?? translations.hy ?? translations.en ?? null;
}

async function loadStorefrontNavCategories(
  locale: Locale,
): Promise<StorefrontNavCategory[]> {
  const rows = await getDb()
    .select({
      id: categories.id,
      translations: categories.translations,
    })
    .from(categories)
    .where(
      and(
        eq(categories.status, "ACTIVE"),
        isNull(categories.deletedAt),
        isNull(categories.parentId),
      ),
    )
    .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

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
      },
    ];
  });
}

/** Active root categories for header / mobile nav dropdowns. */
export async function listStorefrontNavCategories(
  locale: Locale,
): Promise<StorefrontNavCategory[]> {
  return unstable_cache(
    async () => loadStorefrontNavCategories(locale),
    ["storefront-nav-categories", locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}
