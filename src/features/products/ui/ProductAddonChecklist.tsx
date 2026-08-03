"use client";

import type {
  StorefrontAddon,
  StorefrontExclusion,
} from "@/features/products/domain/customization";
import { Check, X } from "lucide-react";

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
  if (addons.length === 0 && exclusions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {addons.length > 0 ? (
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

      {exclusions.length > 0 ? (
        <section className="rounded-[30px] bg-white p-6">
          <h2 className="text-sm leading-5 font-bold text-[#101828]">
            {labels.exclusions}
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {exclusions.map((exclusion) => {
              const selected = selectedExclusionIds.includes(exclusion.id);
              return (
                <li key={exclusion.id}>
                  <button
                    type="button"
                    onClick={() => onToggleExclusion(exclusion.id)}
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
                      <X className="size-3" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-[#1e2939]">
                      {exclusion.label}
                    </span>
                    <span className="sr-only">{labels.removeModifier}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
