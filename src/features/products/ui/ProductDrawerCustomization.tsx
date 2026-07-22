"use client";

import { useState } from "react";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { ModifierCatalogItem } from "@/features/products/domain/modifier-catalog";
import type { ProductCustomization } from "@/features/products/domain/customization";
import { ProductDrawerModifierPanels } from "@/features/products/ui/ProductDrawerModifierPanels";
import { createId } from "@/lib/id";

type ProductDrawerCustomizationProps = {
  value: ProductCustomization;
  catalog: ModifierCatalogItem[];
  onChange: (next: ProductCustomization) => void;
  disabled?: boolean;
};

function localeTriple(label: string): { hy: string; en: string; ru: string } {
  const trimmed = label.trim();
  return { hy: trimmed, en: trimmed, ru: trimmed };
}

function normalizeLabel(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function catalogDisplayLabel(
  label: Partial<Record<"hy" | "en" | "ru", string>>,
): string {
  return label.hy ?? label.en ?? label.ru ?? "";
}

function findCatalogMatch(
  catalog: ModifierCatalogItem[],
  kind: "ADDON" | "EXCLUSION",
  label: string,
): ModifierCatalogItem | undefined {
  const needle = normalizeLabel(label);
  if (!needle) return undefined;
  return catalog.find((item) => {
    if (item.kind !== kind) return false;
    return [item.label.hy, item.label.en, item.label.ru]
      .filter((part): part is string => Boolean(part))
      .some((part) => normalizeLabel(part) === needle);
  });
}

export function ProductDrawerCustomization({
  value,
  catalog,
  onChange,
  disabled = false,
}: ProductDrawerCustomizationProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.products.customization;
  const [addonDraft, setAddonDraft] = useState("");
  const [addonPriceDraft, setAddonPriceDraft] = useState("");
  const [exclusionDraft, setExclusionDraft] = useState("");

  function commit(next: ProductCustomization): void {
    onChange({ ...next, optionGroups: [] });
  }

  function addAddon(): void {
    const label = addonDraft.trim();
    if (!label || disabled) return;

    const attachedIds = new Set(value.addons.map((item) => item.id));
    const existing = findCatalogMatch(catalog, "ADDON", label);
    if (existing) {
      if (attachedIds.has(existing.id)) {
        setAddonDraft("");
        setAddonPriceDraft("");
        return;
      }
      commit({
        ...value,
        addons: [
          ...value.addons,
          {
            id: existing.id,
            label: existing.label,
            priceAmount: existing.priceAmount,
          },
        ],
      });
      setAddonDraft("");
      setAddonPriceDraft("");
      return;
    }

    const priceAmount = Math.max(0, Math.floor(Number(addonPriceDraft) || 0));
    commit({
      ...value,
      addons: [
        ...value.addons,
        { id: createId(), label: localeTriple(label), priceAmount },
      ],
    });
    setAddonDraft("");
    setAddonPriceDraft("");
  }

  function addExclusion(): void {
    const label = exclusionDraft.trim();
    if (!label || disabled) return;

    const attachedIds = new Set(value.exclusions.map((item) => item.id));
    const existing = findCatalogMatch(catalog, "EXCLUSION", label);
    if (existing) {
      if (attachedIds.has(existing.id)) {
        setExclusionDraft("");
        return;
      }
      commit({
        ...value,
        exclusions: [
          ...value.exclusions,
          { id: existing.id, label: existing.label },
        ],
      });
      setExclusionDraft("");
      return;
    }

    commit({
      ...value,
      exclusions: [
        ...value.exclusions,
        { id: createId(), label: localeTriple(label) },
      ],
    });
    setExclusionDraft("");
  }

  function attachCatalogItem(item: ModifierCatalogItem): void {
    if (disabled) return;
    if (item.kind === "ADDON") {
      if (value.addons.some((addon) => addon.id === item.id)) return;
      commit({
        ...value,
        addons: [
          ...value.addons,
          {
            id: item.id,
            label: item.label,
            priceAmount: item.priceAmount,
          },
        ],
      });
      return;
    }

    if (value.exclusions.some((exclusion) => exclusion.id === item.id)) return;
    commit({
      ...value,
      exclusions: [
        ...value.exclusions,
        { id: item.id, label: item.label },
      ],
    });
  }

  const attachedAddonIds = new Set(value.addons.map((item) => item.id));
  const attachedExclusionIds = new Set(
    value.exclusions.map((item) => item.id),
  );
  const libraryAddons = catalog.filter(
    (item) => item.kind === "ADDON" && !attachedAddonIds.has(item.id),
  );
  const libraryExclusions = catalog.filter(
    (item) => item.kind === "EXCLUSION" && !attachedExclusionIds.has(item.id),
  );

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-semibold text-gray-900">{copy.sectionTitle}</p>
      <ProductDrawerModifierPanels
        addons={value.addons}
        exclusions={value.exclusions}
        libraryAddons={libraryAddons.map((item) => ({
          id: item.id,
          label: catalogDisplayLabel(item.label),
          priceAmount: item.priceAmount,
        }))}
        libraryExclusions={libraryExclusions.map((item) => ({
          id: item.id,
          label: catalogDisplayLabel(item.label),
        }))}
        addonDraft={addonDraft}
        addonPriceDraft={addonPriceDraft}
        exclusionDraft={exclusionDraft}
        disabled={disabled}
        copy={copy}
        onAddonDraftChange={setAddonDraft}
        onAddonPriceDraftChange={setAddonPriceDraft}
        onExclusionDraftChange={setExclusionDraft}
        onAddAddon={addAddon}
        onAddExclusion={addExclusion}
        onAttachLibraryAddon={(id) => {
          const item = catalog.find(
            (entry) => entry.id === id && entry.kind === "ADDON",
          );
          if (item) attachCatalogItem(item);
        }}
        onAttachLibraryExclusion={(id) => {
          const item = catalog.find(
            (entry) => entry.id === id && entry.kind === "EXCLUSION",
          );
          if (item) attachCatalogItem(item);
        }}
        onUpdateAddon={(id, patch) =>
          commit({
            ...value,
            addons: value.addons.map((item) =>
              item.id === id
                ? {
                    ...item,
                    label:
                      patch.label != null
                        ? localeTriple(patch.label)
                        : item.label,
                    priceAmount: patch.priceAmount ?? item.priceAmount,
                  }
                : item,
            ),
          })
        }
        onRemoveAddon={(id) =>
          commit({
            ...value,
            addons: value.addons.filter((item) => item.id !== id),
          })
        }
        onUpdateExclusion={(id, label) =>
          commit({
            ...value,
            exclusions: value.exclusions.map((item) =>
              item.id === id ? { ...item, label: localeTriple(label) } : item,
            ),
          })
        }
        onRemoveExclusion={(id) =>
          commit({
            ...value,
            exclusions: value.exclusions.filter((item) => item.id !== id),
          })
        }
      />
    </div>
  );
}
