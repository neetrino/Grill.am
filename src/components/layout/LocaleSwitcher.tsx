"use client";

import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { IconDropdown } from "@/components/ui/IconDropdown";
import type { Locale } from "@/lib/i18n/config";
import { localeLabels, locales } from "@/lib/i18n/config";

type LocaleSwitcherProps = {
  locale: Locale;
  label: string;
  menuPlacement?: "bottom" | "top";
};

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
}: LocaleSwitcherProps) {
  const pathname = usePathname();

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
