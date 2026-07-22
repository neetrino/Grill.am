"use client";

import { useState } from "react";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { ProductCustomization } from "@/features/products/domain/customization";
import { ProductDrawerModifierPanels } from "@/features/products/ui/ProductDrawerModifierPanels";
import { ProductDrawerOptionGroups } from "@/features/products/ui/ProductDrawerOptionGroups";
import { createId } from "@/lib/id";

type ProductDrawerCustomizationProps = {
  value: ProductCustomization;
  onChange: (next: ProductCustomization) => void;
  disabled?: boolean;
};

function localeTriple(label: string): { hy: string; en: string; ru: string } {
  const trimmed = label.trim();
  return { hy: trimmed, en: trimmed, ru: trimmed };
}

export function ProductDrawerCustomization({
  value,
  onChange,
  disabled = false,
}: ProductDrawerCustomizationProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.products.customization;
  const [addonDraft, setAddonDraft] = useState("");
  const [addonPriceDraft, setAddonPriceDraft] = useState("");
  const [exclusionDraft, setExclusionDraft] = useState("");

  function addAddon(): void {
    const label = addonDraft.trim();
    if (!label || disabled) return;
    const priceAmount = Math.max(0, Math.floor(Number(addonPriceDraft) || 0));
    onChange({
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
    onChange({
      ...value,
      exclusions: [
        ...value.exclusions,
        { id: createId(), label: localeTriple(label) },
      ],
    });
    setExclusionDraft("");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-900">{copy.sectionTitle}</p>
        <ProductDrawerModifierPanels
          addons={value.addons}
          exclusions={value.exclusions}
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
          onUpdateAddon={(id, patch) =>
            onChange({
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
            onChange({
              ...value,
              addons: value.addons.filter((item) => item.id !== id),
            })
          }
          onUpdateExclusion={(id, label) =>
            onChange({
              ...value,
              exclusions: value.exclusions.map((item) =>
                item.id === id ? { ...item, label: localeTriple(label) } : item,
              ),
            })
          }
          onRemoveExclusion={(id) =>
            onChange({
              ...value,
              exclusions: value.exclusions.filter((item) => item.id !== id),
            })
          }
        />
      </div>

      <ProductDrawerOptionGroups
        optionGroups={value.optionGroups}
        disabled={disabled}
        copy={copy}
        onChange={(optionGroups) => onChange({ ...value, optionGroups })}
      />
    </div>
  );
}
