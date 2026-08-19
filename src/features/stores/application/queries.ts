import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import {
  mediaAssets,
  storeLocations,
  type StoreLocationTranslationsJson,
} from "@/db/schema";
import {
  resolveStoreTranslation,
  type StoreLocaleCopy,
} from "@/features/stores/domain/store-rules";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

export type AdminStoreListItem = {
  id: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  title: string;
  address: string;
  phone: string | null;
  imageUrl: string | null;
  translations: StoreLocationTranslationsJson;
};

export type StorefrontBranch = {
  slug: string;
  title: string;
  address: string;
  phone: string | null;
  imageUrl: string | null;
};

async function loadStoreImagesByIds(
  storeIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (storeIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      storeLocationId: mediaAssets.storeLocationId,
      objectKey: mediaAssets.objectKey,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.storeLocationId, storeIds),
        eq(mediaAssets.uploadStatus, "READY"),
        eq(mediaAssets.role, "COVER"),
      ),
    );

  for (const row of rows) {
    if (!row.storeLocationId) continue;
    map.set(row.storeLocationId, mediaPublicUrl(row.objectKey));
  }

  return map;
}

function toLocaleCopy(
  translations: StoreLocationTranslationsJson,
  locale: Locale,
): StoreLocaleCopy {
  return (
    resolveStoreTranslation(translations, locale) ?? {
      title: "",
      address: "",
    }
  );
}

/** Lists all store locations for the admin CMS. */
export async function listAdminStores(
  locale: Locale,
): Promise<AdminStoreListItem[]> {
  const rows = await getDb()
    .select()
    .from(storeLocations)
    .orderBy(asc(storeLocations.sortOrder), asc(storeLocations.createdAt));

  const images = await loadStoreImagesByIds(rows.map((row) => row.id));

  return rows.map((row) => {
    const copy = toLocaleCopy(row.translations, locale);
    return {
      id: row.id,
      slug: row.slug,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      title: copy.title || "Untitled",
      address: copy.address,
      phone: row.phone,
      imageUrl: images.get(row.id) ?? null,
      translations: row.translations,
    };
  });
}

async function loadActiveStorefrontBranches(
  locale: Locale,
): Promise<StorefrontBranch[]> {
  const rows = await getDb()
    .select()
    .from(storeLocations)
    .where(eq(storeLocations.isActive, true))
    .orderBy(asc(storeLocations.sortOrder), asc(storeLocations.createdAt));

  const images = await loadStoreImagesByIds(rows.map((row) => row.id));

  return rows.flatMap((row) => {
    const copy = resolveStoreTranslation(row.translations, locale);
    if (!copy) {
      return [];
    }
    return [
      {
        slug: row.slug,
        title: copy.title,
        address: copy.address,
        phone: row.phone,
        imageUrl: images.get(row.id) ?? null,
      },
    ];
  });
}

/** Active branches for the home page, ordered by admin sort. */
export async function listStorefrontBranches(
  locale: Locale,
): Promise<StorefrontBranch[]> {
  return unstable_cache(
    async () => loadActiveStorefrontBranches(locale),
    ["storefront-branches", locale],
    {
      tags: [CACHE_TAGS.stores],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}
