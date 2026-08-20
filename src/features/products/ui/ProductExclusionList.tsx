import { X } from "lucide-react";

import type { StorefrontExclusion } from "@/features/products/domain/customization";

type ProductExclusionListProps = {
  exclusions: StorefrontExclusion[];
  selectedExclusionIds: string[];
  removeModifierLabel: string;
  onToggle: (exclusionId: string) => void;
  columns: "one" | "twoOnDesktop";
};

export function ProductExclusionList({
  exclusions,
  selectedExclusionIds,
  removeModifierLabel,
  onToggle,
  columns,
}: ProductExclusionListProps) {
  return (
    <ul
      className={
        columns === "twoOnDesktop"
          ? "grid grid-cols-1 gap-2 lg:grid-cols-2"
          : "flex flex-col gap-2"
      }
    >
      {exclusions.map((exclusion) => {
        const selected = selectedExclusionIds.includes(exclusion.id);
        return (
          <li key={exclusion.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onToggle(exclusion.id)}
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
              <span className="sr-only">{removeModifierLabel}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
