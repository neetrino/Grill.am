import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { deliveryRules } from "@/db/schema";
import {
  CHECKOUT_DELIVERY_CITY_VALUES,
  normalizeCheckoutDeliveryCity,
  resolveCheckoutDeliveryCity,
} from "@/features/checkout/domain/checkout-delivery-cities";

export type AdminDeliveryLocation = {
  id: string;
  country: string;
  city: string;
  priceAmount: number;
  freeThresholdAmount: number | null;
  priority: number;
};

export type CheckoutDeliveryOption = {
  id: string;
  country: string;
  city: string;
  priceAmount: number;
  freeThresholdAmount: number | null;
  /** Canonical English city name; localize in the UI. */
  label: string;
};

/** Lists all delivery locations for the admin table. */
export async function listAdminDeliveryLocations(): Promise<
  AdminDeliveryLocation[]
> {
  const rows = await getDb()
    .select({
      id: deliveryRules.id,
      country: deliveryRules.countryCode,
      city: deliveryRules.city,
      priceAmount: deliveryRules.priceAmount,
      freeThresholdAmount: deliveryRules.freeThresholdAmount,
      priority: deliveryRules.priority,
    })
    .from(deliveryRules)
    .where(eq(deliveryRules.isActive, true))
    .orderBy(desc(deliveryRules.priority), asc(deliveryRules.city));

  return rows.map((row) => ({
    id: row.id,
    country: row.country,
    city: row.city?.trim() || "",
    priceAmount: row.priceAmount,
    freeThresholdAmount: row.freeThresholdAmount,
    priority: row.priority,
  }));
}

/** Active checkout locations — fixed Armenia regions in display order. */
export async function listCheckoutDeliveryOptions(): Promise<
  CheckoutDeliveryOption[]
> {
  const rows = await getDb()
    .select({
      id: deliveryRules.id,
      country: deliveryRules.countryCode,
      city: deliveryRules.city,
      priceAmount: deliveryRules.priceAmount,
      freeThresholdAmount: deliveryRules.freeThresholdAmount,
      priority: deliveryRules.priority,
    })
    .from(deliveryRules)
    .where(eq(deliveryRules.isActive, true))
    .orderBy(desc(deliveryRules.priority), asc(deliveryRules.city));

  const byCity = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const resolved = resolveCheckoutDeliveryCity(row.city?.trim() || "");
    if (!resolved) {
      continue;
    }
    const key = normalizeCheckoutDeliveryCity(resolved);
    const existing = byCity.get(key);
    if (!existing || row.priority > existing.priority) {
      byCity.set(key, row);
    }
  }

  return CHECKOUT_DELIVERY_CITY_VALUES.flatMap((city) => {
    const row = byCity.get(normalizeCheckoutDeliveryCity(city));
    if (!row) {
      return [];
    }
    return [
      {
        id: row.id,
        country: row.country,
        city,
        priceAmount: row.priceAmount,
        freeThresholdAmount: row.freeThresholdAmount,
        label: city,
      },
    ];
  });
}
