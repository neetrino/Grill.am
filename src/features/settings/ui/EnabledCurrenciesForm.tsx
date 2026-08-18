"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Card } from "@/components/ui/Card";
import { ADMIN_SECTION_TITLE } from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { upsertStoreSettingAction } from "@/features/settings/application/upsert-settings";
import {
  listEnabledCurrencies,
  type StoreEnabledCurrencies,
} from "@/features/settings/domain/store-settings";
import { currencies, currencySymbols, type Currency } from "@/lib/money/currency";

type EnabledCurrenciesFormProps = {
  locale: string;
  enabledCurrencies: StoreEnabledCurrencies;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
};

export function EnabledCurrenciesForm({
  locale,
  enabledCurrencies,
  onSaved,
  onError,
}: EnabledCurrenciesFormProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.settings;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(enabledCurrencies);

  function toggleCurrency(currency: Currency): void {
    const next: StoreEnabledCurrencies = {
      ...enabled,
      [currency]: !enabled[currency],
    };
    if (listEnabledCurrencies(next).length === 0) {
      onError(copy.currencies.needOne);
      return;
    }

    setEnabled(next);
    startTransition(async () => {
      const result = await upsertStoreSettingAction(locale, {
        key: "store.enabledCurrencies",
        value: next,
      });
      if (!result.ok) {
        setEnabled(enabled);
        onError(result.error.message);
        return;
      }
      onSaved(formatAdminMessage(copy.savedKey, { key: result.value.key }));
      router.refresh();
    });
  }

  const enabledCount = listEnabledCurrencies(enabled).length;

  return (
    <Card
      className={`overflow-visible !border-0 !shadow-none p-6 ${ADMIN_CARD_CLASS}`}
    >
      <div className="flex h-full flex-col gap-4">
        <h2 className={ADMIN_SECTION_TITLE}>{copy.currencies.title}</h2>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          {copy.currencies.help}
        </p>
        <ul className="grid grid-cols-3 gap-2">
          {currencies.map((currency) => {
            const isOn = enabled[currency];
            const lastEnabled = isOn && enabledCount === 1;

            return (
              <li
                key={currency}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-2.5 py-2.5"
              >
                <p className="min-w-0 truncate text-sm font-semibold text-gray-900">
                  <span className="mr-1 tabular-nums" aria-hidden>
                    {currencySymbols[currency]}
                  </span>
                  {currency}
                </p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  disabled={isPending || lastEnabled}
                  onClick={() => toggleCurrency(currency)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                    isOn ? "bg-green-500" : "bg-gray-300"
                  }`}
                  aria-label={formatAdminMessage(
                    isOn
                      ? copy.currencies.deactivate
                      : copy.currencies.activate,
                    { currency },
                  )}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      isOn ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
