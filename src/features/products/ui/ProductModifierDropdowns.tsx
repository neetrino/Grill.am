"use client";

import { X } from "lucide-react";

import type {
  StorefrontAddon,
  StorefrontExclusion,
} from "@/features/products/domain/customization";

type ProductModifierDropdownsProps = {
  addons: StorefrontAddon[];
  exclusions: StorefrontExclusion[];
  selectedAddonIds: string[];
  selectedExclusionIds: string[];
  livePricing: boolean;
  formatPrice: (amount: number) => string;
  labels: {
    addons: string;
    exclusions: string;
    selectAddon: string;
    selectExclusion: string;
    removeModifier: string;
  };
  onToggleAddon: (addonId: string) => void;
  onToggleExclusion: (exclusionId: string) => void;
};

const selectClassName =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-400 focus:border-gray-900";

export function ProductModifierDropdowns({
  addons,
  exclusions,
  selectedAddonIds,
  selectedExclusionIds,
  livePricing,
  formatPrice,
  labels,
  onToggleAddon,
  onToggleExclusion,
}: ProductModifierDropdownsProps) {
  const availableAddons = addons.filter(
    (addon) => !selectedAddonIds.includes(addon.id),
  );
  const availableExclusions = exclusions.filter(
    (exclusion) => !selectedExclusionIds.includes(exclusion.id),
  );
  const selectedAddons = addons.filter((addon) =>
    selectedAddonIds.includes(addon.id),
  );
  const selectedExclusions = exclusions.filter((exclusion) =>
    selectedExclusionIds.includes(exclusion.id),
  );

  return (
    <>
      {addons.length > 0 ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-900" htmlFor="pdp-addon-select">
            {labels.addons}
          </label>
          <select
            id="pdp-addon-select"
            className={selectClassName}
            value=""
            onChange={(event) => {
              const addonId = event.target.value;
              if (addonId) onToggleAddon(addonId);
            }}
          >
            <option value="">{labels.selectAddon}</option>
            {availableAddons.map((addon) => (
              <option key={addon.id} value={addon.id}>
                {addon.label}
                {addon.priceAmount > 0 && livePricing
                  ? ` (+${formatPrice(addon.priceAmount)})`
                  : ""}
              </option>
            ))}
          </select>
          {selectedAddons.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {selectedAddons.map((addon) => (
                <li
                  key={addon.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="text-gray-800">{addon.label}</span>
                  <span className="flex items-center gap-2">
                    {addon.priceAmount > 0 && livePricing ? (
                      <span className="text-gray-600">
                        +{formatPrice(addon.priceAmount)}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`${labels.removeModifier}: ${addon.label}`}
                      onClick={() => onToggleAddon(addon.id)}
                      className="rounded p-1 text-gray-500 hover:bg-white hover:text-red-600"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {exclusions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-semibold text-gray-900"
            htmlFor="pdp-exclusion-select"
          >
            {labels.exclusions}
          </label>
          <select
            id="pdp-exclusion-select"
            className={selectClassName}
            value=""
            onChange={(event) => {
              const exclusionId = event.target.value;
              if (exclusionId) onToggleExclusion(exclusionId);
            }}
          >
            <option value="">{labels.selectExclusion}</option>
            {availableExclusions.map((exclusion) => (
              <option key={exclusion.id} value={exclusion.id}>
                {exclusion.label}
              </option>
            ))}
          </select>
          {selectedExclusions.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {selectedExclusions.map((exclusion) => (
                <li
                  key={exclusion.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="text-gray-800">− {exclusion.label}</span>
                  <button
                    type="button"
                    aria-label={`${labels.removeModifier}: ${exclusion.label}`}
                    onClick={() => onToggleExclusion(exclusion.id)}
                    className="rounded p-1 text-gray-500 hover:bg-white hover:text-red-600"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
