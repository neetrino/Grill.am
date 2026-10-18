"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

type ProductModifierAccordionProps = {
  label: string;
  children: ReactNode;
};

/** Mobile add-ons / exclusions toggle shown under the product description. */
export function ProductModifierAccordion({
  label,
  children,
}: ProductModifierAccordionProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="mt-3 lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1 text-base font-semibold text-brand-red transition hover:text-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
      >
        {label}
        <ChevronDown
          className={`size-5 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="mt-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
