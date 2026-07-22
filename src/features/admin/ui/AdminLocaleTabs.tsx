"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";

type AdminLocaleTabsProps = {
  activeLocale: Locale;
  onChange: (locale: Locale) => void;
  disabled?: boolean;
  label?: string;
  /** Locales that already have a title filled in the editor. */
  filledLocales?: ReadonlySet<Locale>;
};

/** Locale selector for admin translation editing (`DEC-017`). */
export function AdminLocaleTabs({
  activeLocale,
  onChange,
  disabled = false,
  label,
  filledLocales,
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
          const filled = filledLocales?.has(loc) === true;
          return (
            <button
              key={loc}
              type="button"
              disabled={disabled}
              onClick={() => onChange(loc)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                selected
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {localeLabels[loc]}
              {filled ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    selected ? "bg-emerald-300" : "bg-emerald-500"
                  }`}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
