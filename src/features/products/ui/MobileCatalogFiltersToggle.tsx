"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

type MobileCatalogFiltersToggleProps = {
  label: string;
  children: ReactNode;
};

/**
 * Mobile catalog filters — pill trigger with smooth expand/collapse.
 */
export function MobileCatalogFiltersToggle({
  label,
  children,
}: MobileCatalogFiltersToggleProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="mb-4 lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-[34px] items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#101828] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-[#fafafa]"
      >
        {label}
        <ChevronDown
          className={`size-4 shrink-0 text-[#6b7280] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open
            ? "mt-3 grid-rows-[1fr] opacity-100"
            : "pointer-events-none mt-0 grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              open ? "translate-y-0" : "-translate-y-1"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
