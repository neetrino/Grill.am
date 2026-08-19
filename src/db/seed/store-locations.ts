import type { StoreLocationTranslationsJson } from "@/db/schema";
import { seedIds } from "@/db/seed/ids";
import { GRILL_STORE_LOCATIONS } from "@/features/stores/yandex-map-embed";
import { locales } from "@/lib/i18n/config";

const STORE_SEED_IDS = [
  seedIds.storeKhorenatsi952,
  seedIds.storeKhorenatsi88,
  seedIds.storePushkin,
  seedIds.storeTotovents,
  seedIds.storeBaghramyan,
  seedIds.storeIsakov,
  seedIds.storeAndranik,
  seedIds.storeSebastia,
  seedIds.storeDavitashen,
] as const;

function titleFromAddress(address: string): string {
  return address.replace(/\s+\d.*$/, "").trim() || address;
}

/** Existing Grill branches for idempotent seed. */
export function buildStoreLocationSeeds() {
  return GRILL_STORE_LOCATIONS.map((store, index) => {
    const translations = Object.fromEntries(
      locales.map((locale) => {
        const address = store.address[locale];
        return [locale, { title: titleFromAddress(address), address }];
      }),
    ) as StoreLocationTranslationsJson;

    return {
      id: STORE_SEED_IDS[index] ?? seedIds.storeKhorenatsi952,
      slug: store.id,
      translations,
      latitude: store.latitude,
      longitude: store.longitude,
      sortOrder: index,
      isActive: true,
    };
  });
}
