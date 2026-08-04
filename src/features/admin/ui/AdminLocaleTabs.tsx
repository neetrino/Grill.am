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
              className={`inline-flex items-center gap-1.5 rounded-[15px] px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                selected
                  ? "bg-brand-red text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-brand-surface"
              }`}
            >
              {localeLabels[loc]}
              {filled ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    selected ? "bg-brand-yellow" : "bg-emerald-500"
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
