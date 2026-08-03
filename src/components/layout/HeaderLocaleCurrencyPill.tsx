"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Banknote, ChevronDown, Globe } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { IconDropdown } from "@/components/ui/IconDropdown";
import { setCurrencyAction } from "@/features/preferences/set-currency-action";
import type { Locale } from "@/lib/i18n/config";
import { localeLabels, locales } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { currencies, currencyLabels } from "@/lib/money/currency";

type HeaderLocaleCurrencyPillProps = {
  locale: Locale;
  currency: Currency;
  languageLabel: string;
  currencyLabel: string;
};

const localeShortLabels: Record<Locale, string> = {
  hy: "HY",
  en: "ENG",
  ru: "RU",
};

function replaceLocaleInPath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/");
  if (segments.length > 1) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }

  return `/${nextLocale}`;
}

export function HeaderLocaleCurrencyPill({
  locale,
  currency,
  languageLabel,
  currencyLabel,
}: HeaderLocaleCurrencyPillProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <IconDropdown
      label={`${languageLabel} / ${currencyLabel}`}
      triggerClassName="inline-flex h-[49px] min-w-[212px] items-center justify-center gap-2 rounded-full bg-brand-surface px-6 text-base font-bold text-[#333] capitalize transition hover:bg-[#ececec]"
      trigger={
        <>
          <Globe className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <span>{localeShortLabels[locale]}</span>
          <span aria-hidden>/</span>
          <Banknote className="h-3.5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <span>{currency}</span>
          <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0" aria-hidden />
        </>
      }
    >
      <div className="border-b border-gray-100 px-4 py-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
        {languageLabel}
      </div>
      {locales.map((item) => {
        const href = replaceLocaleInPath(pathname, item);
        const selected = item === locale;

        return (
          <AppLink
            key={item}
            href={href}
            hrefLang={item}
            prefetchPolicy="intent"
            role="menuitem"
            aria-current={selected ? "page" : undefined}
            className={
              selected
                ? "block px-4 py-2.5 text-sm font-semibold text-gray-900"
                : "block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }
          >
            {localeShortLabels[item]}{" "}
            <span className="text-gray-400">· {localeLabels[item]}</span>
          </AppLink>
        );
      })}
      <div className="border-t border-b border-gray-100 px-4 py-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
        {currencyLabel}
      </div>
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
            <span>{item}</span>
            <span className="truncate text-xs text-gray-500">
              {currencyLabels[item]}
            </span>
          </button>
        );
      })}
    </IconDropdown>
  );
}
