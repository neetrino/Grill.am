import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { storeLocations, type StoreLocationTranslationsJson } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  upsertStoreSchema,
  type UpsertStoreInput,
} from "@/features/stores/schemas/admin-store";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { isLocale, type Locale } from "@/lib/i18n/config";

export function mergeStoreTranslations(
  existing: StoreLocationTranslationsJson | null | undefined,
  editingLocale: Locale,
  data: UpsertStoreInput,
): StoreLocationTranslationsJson {
  return {
    ...(existing ?? {}),
    [editingLocale]: {
      title: data.title,
      address: data.address,
    },
  };
}

export function parseStoreDrawerFormData(
  formData: FormData,
  fallbackLocale: Locale,
): UpsertStoreInput | null {
  const rawEditingLocale = formData.get("editingLocale");
  const editingLocale =
    typeof rawEditingLocale === "string" && isLocale(rawEditingLocale)
      ? rawEditingLocale
      : fallbackLocale;
  const phone = String(formData.get("phone") ?? "").trim();

  const parsed = upsertStoreSchema.safeParse({
    editingLocale,
    title: formData.get("title"),
    address: formData.get("address"),
    phone: phone || undefined,
  });
  return parsed.success ? parsed.data : null;
}

export function revalidateStores(locale: string): void {
  revalidatePath(`/${locale}/admin/stores`);
  for (const loc of ["hy", "en", "ru"] as const) {
    revalidatePath(`/${loc}`);
  }
  updateTag(CACHE_TAGS.stores);
}

export async function allocateUniqueStoreSlug(base: string): Promise<string> {
  return withTransaction(async (tx) => {
    let slug = base;
    let suffix = 2;
    while (true) {
      const [existing] = await tx
        .select({ id: storeLocations.id })
        .from(storeLocations)
        .where(eq(storeLocations.slug, slug))
        .limit(1);
      if (!existing) {
        return slug;
      }
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
  });
}
