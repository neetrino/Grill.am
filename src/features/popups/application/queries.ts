import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import { mediaAssets, popups } from "@/db/schema";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import { mediaPublicUrl } from "@/lib/media/public-url";
import { formatAppDateTimeMinutes } from "@/lib/datetime/app-timezone";

export type AdminPopupListItem = {
  id: string;
  isActive: boolean;
  imageUrl: string | null;
  createdAtLabel: string;
};

export type StorefrontPopup = {
  id: string;
  imageUrl: string;
};

async function loadPopupImageByIds(
  popupIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (popupIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      popupId: mediaAssets.popupId,
      objectKey: mediaAssets.objectKey,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.popupId, popupIds),
        eq(mediaAssets.uploadStatus, "READY"),
        eq(mediaAssets.role, "COVER"),
      ),
    );

  for (const row of rows) {
    if (!row.popupId) continue;
    map.set(row.popupId, mediaPublicUrl(row.objectKey));
  }

  return map;
}

/** Lists all popups for the admin CMS, newest first. */
export async function listAdminPopups(): Promise<AdminPopupListItem[]> {
  const rows = await getDb()
    .select()
    .from(popups)
    .orderBy(desc(popups.createdAt));

  const images = await loadPopupImageByIds(rows.map((row) => row.id));

  return rows.map((row) => ({
    id: row.id,
    isActive: row.isActive,
    imageUrl: images.get(row.id) ?? null,
    createdAtLabel: formatAppDateTimeMinutes(row.createdAt),
  }));
}

async function loadActiveStorefrontPopup(): Promise<StorefrontPopup | null> {
  const [row] = await getDb()
    .select()
    .from(popups)
    .where(eq(popups.isActive, true))
    .orderBy(asc(popups.createdAt))
    .limit(1);

  if (!row) {
    return null;
  }

  const images = await loadPopupImageByIds([row.id]);
  const imageUrl = images.get(row.id);
  if (!imageUrl) {
    return null;
  }

  return { id: row.id, imageUrl };
}

/** Active popup for the storefront overlay (image required). */
export async function getActiveStorefrontPopup(): Promise<StorefrontPopup | null> {
  return unstable_cache(
    async () => loadActiveStorefrontPopup(),
    ["active-storefront-popup-v2"],
    {
      tags: [CACHE_TAGS.popups],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}
