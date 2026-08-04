"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { SegmentedControl } from "@/components/layout/SegmentedControl";
import { AppLink } from "@/components/ui/AppLink";
import { IconDropdown } from "@/components/ui/IconDropdown";
import type { Locale } from "@/lib/i18n/config";
import { localeLabels, locales } from "@/lib/i18n/config";

type LocaleSwitcherProps = {
  locale: Locale;
  label: string;
  menuPlacement?: "bottom" | "top";
  /** Inline EN / РУС / ՀԱՅ control (mobile burger). */
  variant?: "dropdown" | "segmented";
};

const localeShortLabels: Record<Locale, string> = {
  en: "EN",
  ru: "РУС",
  hy: "ՀԱՅ",
};

/** Display order for segmented control: EN / РУС / ՀԱՅ. */
const segmentedLocales: readonly Locale[] = ["en", "ru", "hy"];

function replaceLocaleInPath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/");
  if (segments.length > 1) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }

  return `/${nextLocale}`;
}

export function LocaleSwitcher({
  locale,
  label,
  menuPlacement = "bottom",
  variant = "dropdown",
}: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState(locale);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setActiveLocale(locale);
    });
    return () => cancelAnimationFrame(frame);
  }, [locale]);

  if (variant === "segmented") {
    return (
      <SegmentedControl
        aria-label={label}
        value={activeLocale}
        options={segmentedLocales.map((item) => ({
          value: item,
          label: localeShortLabels[item],
          href: replaceLocaleInPath(pathname, item),
        }))}
        renderOption={({ option, selected, className }) => (
          <AppLink
            href={option.href ?? `/${option.value}`}
            hrefLang={option.value}
            prefetchPolicy="intent"
            aria-current={selected ? "page" : undefined}
            className={className}
            onClick={() => {
              setActiveLocale(option.value);
            }}
            onMouseEnter={() => {
              router.prefetch(option.href ?? `/${option.value}`);
            }}
          >
            {option.label}
          </AppLink>
        )}
      />
    );
  }

  return (
    <IconDropdown
      label={label}
      menuPlacement={menuPlacement}
      trigger={
        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
          {localeLabels[locale]}
          <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
      }
    >
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
            {localeLabels[item]}
          </AppLink>
        );
      })}
    </IconDropdown>
  );
}
