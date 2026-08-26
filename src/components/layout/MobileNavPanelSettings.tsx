"use client";

import type { ReactNode } from "react";

import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type MobileNavPanelSettingsProps = {
  locale: Locale;
  currency: Currency;
  availableCurrencies: readonly Currency[];
  dictionary: Dictionary;
  authAction: ReactNode;
  onClose: () => void;
};

/** Language, login, and optional currency controls at the bottom of the burger panel. */
export function MobileNavPanelSettings({
  locale,
  currency,
  availableCurrencies,
  dictionary,
  authAction,
  onClose,
}: MobileNavPanelSettingsProps) {
  return (
    <div className="space-y-3 border-t border-gray-100 py-4">
      <div className="grid grid-cols-2 grid-rows-[auto_1fr] gap-x-3 gap-y-2">
        <span className="col-start-1 row-start-1 text-xs font-medium tracking-wide text-gray-500">
          {dictionary.header.language}
        </span>
        <div className="col-start-1 row-start-2 min-w-0">
          <LocaleSwitcher
            locale={locale}
            label={dictionary.header.language}
            variant="segmented"
          />
        </div>
        <div
          className="col-start-2 row-start-2 flex min-h-0 min-w-0"
          onClick={onClose}
        >
          {authAction}
        </div>
      </div>
      {availableCurrencies.length > 1 ? (
        <div className="min-w-0 space-y-2">
          <span className="text-xs font-medium tracking-wide text-gray-500">
            {dictionary.header.currency}
          </span>
          <CurrencySwitcher
            currency={currency}
            availableCurrencies={availableCurrencies}
            label={dictionary.header.currency}
            variant="segmented"
          />
        </div>
      ) : null}
    </div>
  );
}
