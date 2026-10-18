import { Check } from "lucide-react";

import type { StorefrontAddon } from "@/features/products/domain/customization";

type ProductAddonListProps = {
  addons: StorefrontAddon[];
  selectedAddonIds: string[];
  livePricing: boolean;
  formatPrice: (amount: number) => string;
  onToggle: (addonId: string) => void;
};

export function ProductAddonList({
  addons,
  selectedAddonIds,
  livePricing,
  formatPrice,
  onToggle,
}: ProductAddonListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {addons.map((addon) => {
        const selected = selectedAddonIds.includes(addon.id);
        return (
          <li key={addon.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onToggle(addon.id)}
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
  );
}
