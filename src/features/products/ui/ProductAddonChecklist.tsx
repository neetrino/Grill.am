"use client";

import type {
  StorefrontAddon,
  StorefrontExclusion,
} from "@/features/products/domain/customization";
import { ProductAddonList } from "@/features/products/ui/ProductAddonList";
import { ProductExclusionList } from "@/features/products/ui/ProductExclusionList";

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

/** Desktop modifier cards; phones use the accordions inside the buy box. */
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
    <div className="hidden lg:flex lg:flex-col lg:gap-6">
      {hasAddons ? (
        <section className="rounded-[30px] bg-white p-6">
          <h2 className="text-sm leading-5 font-bold text-[#101828]">
            {labels.addons}
          </h2>
          <div className="mt-4">
            <ProductAddonList
              addons={addons}
              selectedAddonIds={selectedAddonIds}
              livePricing={livePricing}
              formatPrice={formatPrice}
              onToggle={onToggleAddon}
            />
          </div>
        </section>
      ) : null}

      {hasExclusions ? (
        <section className="rounded-[30px] bg-white p-6">
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
