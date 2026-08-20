"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import type { StorefrontExclusion } from "@/features/products/domain/customization";
import { ProductExclusionList } from "@/features/products/ui/ProductExclusionList";

type ProductExclusionsAccordionProps = {
  exclusions: StorefrontExclusion[];
  selectedExclusionIds: string[];
  labels: {
    exclusions: string;
    removeModifier: string;
  };
  onToggleExclusion: (exclusionId: string) => void;
};

/** Mobile exclusions toggle shown under the product description. */
export function ProductExclusionsAccordion({
  exclusions,
  selectedExclusionIds,
  labels,
  onToggleExclusion,
}: ProductExclusionsAccordionProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (exclusions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1 text-base font-semibold text-brand-red transition hover:text-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
      >
        {labels.exclusions}
        <ChevronDown
          className={`size-5 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="mt-3">
          <ProductExclusionList
            exclusions={exclusions}
            selectedExclusionIds={selectedExclusionIds}
            removeModifierLabel={labels.removeModifier}
            onToggle={onToggleExclusion}
            columns="one"
          />
        </div>
      ) : null}
    </div>
  );
}
