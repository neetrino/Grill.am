"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";

type AdminLocaleTabsProps = {
  activeLocale: Locale;
  onChange: (locale: Locale) => void;
  disabled?: boolean;
  label?: string;
};

/** Locale selector for admin translation editing (`DEC-017`). */
export function AdminLocaleTabs({
  activeLocale,
  onChange,
  disabled = false,
  label,
}: AdminLocaleTabsProps) {
  const dictionary = useAdminDictionary();
  const heading = label ?? dictionary.common.translations;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
        {heading}
      </p>
      <div className="flex flex-wrap gap-2">
        {locales.map((loc) => {
          const selected = loc === activeLocale;
          return (
            <button
              key={loc}
              type="button"
              disabled={disabled}
              onClick={() => onChange(loc)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                selected
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {localeLabels[loc]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
