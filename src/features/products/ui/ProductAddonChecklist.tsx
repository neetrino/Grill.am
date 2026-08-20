"use client";

import type {
  StorefrontAddon,
  StorefrontExclusion,
} from "@/features/products/domain/customization";
import { ProductExclusionList } from "@/features/products/ui/ProductExclusionList";
import { Check } from "lucide-react";

type ProductAddonChecklistProps = {
  addons: StorefrontAddon[];
  exclusions: StorefrontExclusion[];
  selectedAddonIds: string[];
  selectedExclusionIds: string[];
  livePricing: boolean;
  formatPrice: (amount: number) => string;
  labels: {
    addons: string;
    exclusions: string;
    removeModifier: string;
  };
  onToggleAddon: (addonId: string) => void;
  onToggleExclusion: (exclusionId: string) => void;
};

export function ProductAddonChecklist({
  addons,
  exclusions,
  selectedAddonIds,
  selectedExclusionIds,
  livePricing,
  formatPrice,
  labels,
  onToggleAddon,
  onToggleExclusion,
}: ProductAddonChecklistProps) {
  const hasAddons = addons.length > 0;
  const hasExclusions = exclusions.length > 0;
  if (!hasAddons && !hasExclusions) {
    return null;
  }

  return (
    <div
      className={
        hasAddons
          ? "flex flex-col gap-6"
          : "hidden lg:flex lg:flex-col lg:gap-6"
      }
    >
      {hasAddons ? (
        <section className="rounded-[30px] bg-white p-6">
          <h2 className="text-sm leading-5 font-bold text-[#101828]">
            {labels.addons}
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {addons.map((addon) => {
              const selected = selectedAddonIds.includes(addon.id);
              return (
                <li key={addon.id}>
                  <button
                    type="button"
                    onClick={() => onToggleAddon(addon.id)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition ${
                      selected
                        ? "border-brand-red/30 bg-[#fff4ee]"
                        : "border-[#f3f4f6] bg-[#fafafa] hover:border-[#e5e7eb]"
                    }`}
                  >
                    <span
                      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-lg ${
                        selected
                          ? "bg-brand-red text-white"
                          : "bg-[#e5e7eb] text-transparent"
                      }`}
                      aria-hidden
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-[#1e2939]">
                      {addon.label}
                    </span>
                    {addon.priceAmount > 0 && livePricing ? (
                      <span
                        className={`shrink-0 text-sm font-bold ${
                          selected ? "text-brand-red" : "text-[#9ca3af]"
                        }`}
                      >
                        +{formatPrice(addon.priceAmount)}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {hasExclusions ? (
        <section className="hidden rounded-[30px] bg-white p-6 lg:block">
          <h2 className="text-sm leading-5 font-bold text-[#101828]">
            {labels.exclusions}
          </h2>
          <div className="mt-4">
            <ProductExclusionList
              exclusions={exclusions}
              selectedExclusionIds={selectedExclusionIds}
              removeModifierLabel={labels.removeModifier}
              onToggle={onToggleExclusion}
              columns="twoOnDesktop"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
