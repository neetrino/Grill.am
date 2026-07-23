import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { modifierCatalog, products } from "@/db/schema";
import {
  parseProductCustomization,
  type ProductCustomization,
} from "@/features/products/domain/customization";
import type { ModifierCatalogItem } from "@/features/products/domain/modifier-catalog";
import { invalidateProductsCache } from "@/lib/cache/invalidate-public";

export type { ModifierCatalogItem } from "@/features/products/domain/modifier-catalog";

function labelsEqual(
  a: Partial<Record<"hy" | "en" | "ru", string>>,
  b: Partial<Record<"hy" | "en" | "ru", string>>,
): boolean {
  return a.hy === b.hy && a.en === b.en && a.ru === b.ru;
}

/** Lists the shared addon/exclusion library for admin pickers. */
export async function listModifierCatalog(): Promise<ModifierCatalogItem[]> {
  const rows = await getDb()
    .select({
      id: modifierCatalog.id,
      kind: modifierCatalog.kind,
      label: modifierCatalog.label,
      priceAmount: modifierCatalog.priceAmount,
    })
    .from(modifierCatalog)
    .orderBy(asc(modifierCatalog.kind), asc(modifierCatalog.createdAt));

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    label: row.label,
    priceAmount: row.priceAmount,
  }));
}

/**
 * Upserts catalog rows from a product customization, then rewrites peer
 * products that embed the same IDs so denormalized label/price stay in sync.
 */
export async function syncCustomizationToModifierCatalog(
  customization: ProductCustomization | null,
): Promise<void> {
  if (!customization) return;

  const items: ModifierCatalogItem[] = [
    ...customization.addons.map((addon) => ({
      id: addon.id,
      kind: "ADDON" as const,
      label: addon.label,
      priceAmount: addon.priceAmount,
    })),
    ...customization.exclusions.map((exclusion) => ({
      id: exclusion.id,
      kind: "EXCLUSION" as const,
      label: exclusion.label,
      priceAmount: 0,
    })),
  ];

  if (items.length === 0) return;

  const db = getDb();
  const now = new Date();

  for (const item of items) {
    await db
      .insert(modifierCatalog)
      .values({
        id: item.id,
        kind: item.kind,
        label: item.label,
        priceAmount: item.priceAmount,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: modifierCatalog.id,
        set: {
          kind: item.kind,
          label: item.label,
          priceAmount: item.priceAmount,
          updatedAt: now,
        },
      });
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const peers = await db
    .select({
      id: products.id,
      customization: products.customization,
    })
    .from(products)
    .where(sql`${products.customization} IS NOT NULL`);

  let touchedPeers = false;

  for (const peer of peers) {
    const parsed = parseProductCustomization(peer.customization);
    if (!parsed) continue;

    let changed = false;
    const addons = parsed.addons.map((addon) => {
      const catalogItem = byId.get(addon.id);
      if (!catalogItem || catalogItem.kind !== "ADDON") return addon;
      if (
        labelsEqual(addon.label, catalogItem.label) &&
        addon.priceAmount === catalogItem.priceAmount
      ) {
        return addon;
      }
      changed = true;
      return {
        id: catalogItem.id,
        label: catalogItem.label,
        priceAmount: catalogItem.priceAmount,
      };
    });

    const exclusions = parsed.exclusions.map((exclusion) => {
      const catalogItem = byId.get(exclusion.id);
      if (!catalogItem || catalogItem.kind !== "EXCLUSION") return exclusion;
      if (labelsEqual(exclusion.label, catalogItem.label)) return exclusion;
      changed = true;
      return {
        id: catalogItem.id,
        label: catalogItem.label,
      };
    });

    if (!changed) continue;

    touchedPeers = true;
    await db
      .update(products)
      .set({
        customization: {
          optionGroups: parsed.optionGroups,
          addons,
          exclusions,
        },
        updatedAt: now,
      })
      .where(eq(products.id, peer.id));
  }

  if (touchedPeers) {
    invalidateProductsCache({ allProductDetails: true });
  }
}
