import type { Locale } from "@/lib/i18n/config";

/** Official Grill.am Yandex Maps Constructor widget (same as grill.am/contact). */
export const YANDEX_STORE_MAP_EMBED_SRC =
  "https://yandex.ru/map-widget/v1/?um=constructor%3Abb3de1b26b88b4a4466f05324e1c51572dffd23e5059ee6b685e8eb7d12da0d9&source=constructor";

export type StoreLocation = {
  id: string;
  latitude: number;
  longitude: number;
  /** Localized short address. */
  address: Record<Locale, string>;
};

/**
 * Full Grill.am branch list.
 * Focus uses constructor map + ll/z so the branded pin design stays.
 */
export const GRILL_STORE_LOCATIONS: readonly StoreLocation[] = [
  {
    id: "khorenatsi-95-2",
    latitude: 40.1650047,
    longitude: 44.5157429,
    address: {
      hy: "Խորենացի 95/2",
      en: "Khorenatsi 95/2",
      ru: "Хоренаци 95/2",
    },
  },
  {
    id: "khorenatsi-88",
    latitude: 40.16504396916831,
    longitude: 44.51524888164161,
    address: {
      hy: "Խորենացի 88",
      en: "Khorenatsi 88",
      ru: "Хоренаци 88",
    },
  },
  {
    id: "pushkin-43-3",
    latitude: 40.18513214380965,
    longitude: 44.509024815622446,
    address: {
      hy: "Պուշկին 43/3",
      en: "Pushkin 43/3",
      ru: "Пушкин 43/3",
    },
  },
  {
    id: "totovents-2-7",
    latitude: 40.20162759451002,
    longitude: 44.56806828266752,
    address: {
      hy: "Թոթովենց 2/7",
      en: "Totovents 2/7",
      ru: "Тотовенц 2/7",
    },
  },
  {
    id: "baghramyan-50-5",
    latitude: 40.19244704040017,
    longitude: 44.502048389975556,
    address: {
      hy: "Բաղրամյան 50/5",
      en: "Baghramyan 50/5",
      ru: "Баграмян 50/5",
    },
  },
  {
    id: "isakov-27",
    latitude: 40.16418895562438,
    longitude: 44.41802551037388,
    address: {
      hy: "Ծովակալ Իսակովի 27",
      en: "Admiral Isakov 27",
      ru: "Адмирала Исакова 27",
    },
  },
  {
    id: "andranik-94-4",
    latitude: 40.17072218226695,
    longitude: 44.44593255407077,
    address: {
      hy: "Անդրանիկի 94/4",
      en: "Andranik 94/4",
      ru: "Андраника 94/4",
    },
  },
  {
    id: "sebastia-16-1",
    latitude: 40.185160941144254,
    longitude: 44.46107630616896,
    address: {
      hy: "Սեբաստիա 16/1",
      en: "Sebastia 16/1",
      ru: "Себастия 16/1",
    },
  },
  {
    id: "tigran-petrosyan-13-8",
    latitude: 40.2215195,
    longitude: 44.4950089,
    address: {
      hy: "Տիգրան Պետրոսյան 13/8",
      en: "Tigran Petrosyan 13/8",
      ru: "Тигран Петросян 13/8",
    },
  },
] as const;

const STORE_FOCUS_ZOOM = 16;

/** Localized address list for header/footer/contact. */
export function getStoreAddresses(locale: Locale): readonly string[] {
  return GRILL_STORE_LOCATIONS.map((store) => store.address[locale]);
}

/** Checkout pickup-branch option (id + localized address). */
export type StorePickupOption = {
  id: string;
  label: string;
};

/** Resolve a branch by stable store id. */
export function getStoreById(
  storeId: string | null | undefined,
): StoreLocation | undefined {
  if (!storeId) {
    return undefined;
  }
  return GRILL_STORE_LOCATIONS.find((store) => store.id === storeId);
}

/** Localized pickup-branch options for checkout. */
export function getStorePickupOptions(locale: Locale): StorePickupOption[] {
  return GRILL_STORE_LOCATIONS.map((store) => ({
    id: store.id,
    label: store.address[locale],
  }));
}

/** Resolve store list index from `?store=` id. */
export function getStoreIndexById(storeId: string | null | undefined): number | null {
  if (!storeId) {
    return null;
  }
  const index = GRILL_STORE_LOCATIONS.findIndex((store) => store.id === storeId);
  return index >= 0 ? index : null;
}

/** Storefront stores page href, optionally preselecting a branch. */
export function buildStoresPageHref(
  locale: Locale,
  storeId?: string | null,
): string {
  const base = `/${locale}/stores`;
  if (!storeId) {
    return base;
  }
  return `${base}?store=${encodeURIComponent(storeId)}`;
}

/**
 * Same branded constructor map, panned/zoomed to a store.
 * Keeps Grill red food pins — does not switch to a different widget style.
 */
export function buildYandexStoreFocusEmbedSrc(store: StoreLocation): string {
  const { latitude, longitude } = store;
  return `${YANDEX_STORE_MAP_EMBED_SRC}&ll=${longitude}%2C${latitude}&z=${STORE_FOCUS_ZOOM}`;
}

/** Overview constructor map, or focused constructor view for a selected store. */
export function resolveStoreMapEmbedSrc(selectedIndex: number | null): string {
  if (selectedIndex == null) {
    return YANDEX_STORE_MAP_EMBED_SRC;
  }
  const store = GRILL_STORE_LOCATIONS[selectedIndex];
  if (!store) {
    return YANDEX_STORE_MAP_EMBED_SRC;
  }
  return buildYandexStoreFocusEmbedSrc(store);
}
