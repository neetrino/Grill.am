/** Always first in checkout delivery location lists. */
export const CHECKOUT_DELIVERY_CITY_PRIMARY = "Yerevan";

/** Stable English city keys stored on delivery_rules.city. */
export const CHECKOUT_DELIVERY_CITY_VALUES = [
  CHECKOUT_DELIVERY_CITY_PRIMARY,
  "Aragatsotn",
  "Ararat",
  "Armavir",
  "Gegharkunik",
  "Kotayk",
  "Lori",
  "Shirak",
  "Syunik",
  "Tavush",
  "Vayots Dzor",
] as const;

export type CheckoutDeliveryCity =
  (typeof CHECKOUT_DELIVERY_CITY_VALUES)[number];

/** i18n key under `checkout.deliveryCities.*`. */
export const CHECKOUT_DELIVERY_CITY_I18N_KEYS = {
  Yerevan: "yerevan",
  Aragatsotn: "aragatsotn",
  Ararat: "ararat",
  Armavir: "armavir",
  Gegharkunik: "gegharkunik",
  Kotayk: "kotayk",
  Lori: "lori",
  Shirak: "shirak",
  Syunik: "syunik",
  Tavush: "tavush",
  "Vayots Dzor": "vayotsDzor",
} as const satisfies Record<CheckoutDeliveryCity, string>;

export function normalizeCheckoutDeliveryCity(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isCheckoutDeliveryCity(
  value: string,
): value is CheckoutDeliveryCity {
  const normalized = normalizeCheckoutDeliveryCity(value);
  return CHECKOUT_DELIVERY_CITY_VALUES.some(
    (city) => normalizeCheckoutDeliveryCity(city) === normalized,
  );
}

export function resolveCheckoutDeliveryCity(
  value: string,
): CheckoutDeliveryCity | null {
  const normalized = normalizeCheckoutDeliveryCity(value);
  return (
    CHECKOUT_DELIVERY_CITY_VALUES.find(
      (city) => normalizeCheckoutDeliveryCity(city) === normalized,
    ) ?? null
  );
}
