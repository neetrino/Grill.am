"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";

import { SegmentedControl } from "@/components/layout/SegmentedControl";
import { IconDropdown } from "@/components/ui/IconDropdown";
import { setCurrencyAction } from "@/features/preferences/set-currency-action";
import type { Currency } from "@/lib/money/currency";
import {
  currencies,
  currencyLabels,
  currencySymbols,
} from "@/lib/money/currency";

type CurrencySwitcherProps = {
  currency: Currency;
  label: string;
  menuPlacement?: "bottom" | "top";
  /** Inline AMD / USD / RUB control (mobile burger). */
  variant?: "dropdown" | "segmented";
};

export function CurrencySwitcher({
  currency,
  label,
  menuPlacement = "bottom",
  variant = "dropdown",
}: CurrencySwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeCurrency, setActiveCurrency] = useState(currency);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setActiveCurrency(currency);
    });
    return () => cancelAnimationFrame(frame);
  }, [currency]);

  if (variant === "segmented") {
    return (
      <SegmentedControl
        aria-label={label}
        value={activeCurrency}
        disabled={pending}
        options={currencies.map((item) => ({
          value: item,
          label: item,
        }))}
        onSelect={(item) => {
          setActiveCurrency(item);
          startTransition(async () => {
            await setCurrencyAction(item);
            router.refresh();
          });
        }}
      />
    );
  }

  return (
    <IconDropdown
      label={`${label}: ${currency}`}
      menuPlacement={menuPlacement}
      trigger={
        <span className="inline-flex items-center gap-2 text-gray-800">
          <span className="text-base leading-none font-semibold tabular-nums">
            {currencySymbols[currency]}
          </span>
          <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
      }
    >
      {currencies.map((item) => {
        const selected = item === currency;

        return (
          <button
            key={item}
            type="button"
            role="menuitem"
            disabled={pending}
            aria-current={selected ? "true" : undefined}
            className={
              selected
                ? "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-semibold text-gray-900"
                : "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }
            onClick={() => {
              startTransition(async () => {
                await setCurrencyAction(item);
                router.refresh();
              });
            }}
          >
            <span className="text-lg tabular-nums" aria-hidden="true">
              {currencySymbols[item]}
            </span>
            <span className="truncate text-xs text-gray-500">
              {currencyLabels[item]}
            </span>
          </button>
        );
      })}
    </IconDropdown>
  );
}
