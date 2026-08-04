"use client";

import { MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { resolveStoreMapEmbedSrc } from "@/features/stores/yandex-map-embed";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type StoresPageViewProps = {
  addresses: readonly string[];
  copy: Dictionary["stores"];
  initialSelectedIndex?: number | null;
};

const PANEL_CLASS =
  "flex min-h-0 flex-col overflow-hidden rounded-[15px] border border-gray-100 bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.05)] sm:p-6";

/** Storefront stores page — address list + official constructor map (zoom on select). */
export function StoresPageView({
  addresses,
  copy,
  initialSelectedIndex = null,
}: StoresPageViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    initialSelectedIndex,
  );
  const mapSrc = useMemo(
    () => resolveStoreMapEmbedSrc(selectedIndex),
    [selectedIndex],
  );

  useEffect(() => {
    setSelectedIndex(initialSelectedIndex);
  }, [initialSelectedIndex]);

  if (addresses.length === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-7xl items-center justify-center px-4 py-12">
        <div className="max-w-lg rounded-[15px] border border-gray-100 bg-white p-8 text-center shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
          <h1 className="text-[26px] leading-tight font-black uppercase sm:text-[30px] sm:leading-[1.2]">
            <span className="text-brand-red">{copy.titleLead}</span>{" "}
            <span className="text-[#171717]">{copy.titleAccent}</span>
          </h1>
          <p className="mt-3 text-gray-600">{copy.empty}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:pb-14 lg:pt-12">
      <header className="mb-6 lg:mb-8">
        <h1 className="text-[26px] leading-tight font-black uppercase sm:text-[30px] sm:leading-[1.2]">
          <span className="text-brand-red">{copy.titleLead}</span>{" "}
          <span className="text-[#171717]">{copy.titleAccent}</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] lg:gap-6">
        <section className={`${PANEL_CLASS} lg:h-[560px]`}>
          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {addresses.map((address, index) => {
              const isSelected = index === selectedIndex;

              return (
                <li key={address}>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`relative flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-brand-red/40 bg-brand-red/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {isSelected ? (
                      <span
                        className="absolute top-1/2 right-3 size-2.5 -translate-y-1/2 rounded-full bg-brand-red"
                        aria-hidden
                      />
                    ) : null}
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white">
                      <MapPin
                        className="size-4 text-brand-red"
                        aria-hidden
                      />
                    </span>
                    <span className="pr-4 text-sm leading-snug font-medium text-gray-800">
                      {address}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`${PANEL_CLASS} min-h-[320px] lg:h-[560px]`}>
          <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-[12px] bg-gray-100 sm:min-h-[320px]">
            <iframe
              key={mapSrc}
              title={copy.mapTitle}
              src={mapSrc}
              className="absolute inset-0 size-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </div>
    </div>
  );
}
