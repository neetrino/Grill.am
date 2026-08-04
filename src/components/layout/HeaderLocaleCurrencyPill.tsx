"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { ChevronDown, Globe } from "lucide-react";
import { createPortal } from "react-dom";

import { HeaderCurrencyIcon } from "@/components/layout/HeaderIcons";
import { AppLink } from "@/components/ui/AppLink";
import {
  DROPDOWN_ANIMATION_MS,
  DROPDOWN_PANEL_PORTAL_CLASS,
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
import { useDropdownPortalPosition } from "@/components/ui/use-dropdown-portal-position";
import { setCurrencyAction } from "@/features/preferences/set-currency-action";
import type { Locale } from "@/lib/i18n/config";
import { localeLabels, locales } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { currencies } from "@/lib/money/currency";

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

function subscribeNoop(): () => void {
  return () => undefined;
}

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
  const canPortal = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [pending, startTransition] = useTransition();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const menuPosition = useDropdownPortalPosition(mounted, triggerRef, {
    matchTriggerWidth: true,
    lockTriggerWidth: true,
  });

  function clearCloseTimer(): void {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMenu(): void {
    clearCloseTimer();
    setOpen(true);
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }

  function closeMenu(): void {
    clearCloseTimer();
    setOpen(false);
    setVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
    }, DROPDOWN_ANIMATION_MS);
  }

  function toggleMenu(): void {
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      closeMenu();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open]);

  const selectedItemClassName =
    "flex w-full justify-center whitespace-nowrap rounded-lg bg-brand-red/15 px-2.5 py-1.5 text-center text-sm font-semibold text-brand-red transition-colors";
  const idleItemClassName =
    "flex w-full justify-center whitespace-nowrap rounded-lg px-2.5 py-1.5 text-center text-sm text-gray-500 transition-colors hover:bg-gray-50";

  const panel =
    canPortal && mounted && menuPosition
      ? createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="dialog"
            aria-label={`${currencyLabel} / ${languageLabel}`}
            className={`${DROPDOWN_PANEL_PORTAL_CLASS} overflow-hidden py-2 ${dropdownPanelStateClass(visible)}`}
            style={dropdownPortalStyle(menuPosition)}
          >
            <div className="flex w-full">
              <div className="min-w-0 flex-1 border-r border-gray-100">
                <p className="whitespace-nowrap px-3 pb-1 text-center text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                  {currencyLabel}
                </p>
                <ul
                  role="listbox"
                  aria-label={currencyLabel}
                  className="px-1.5"
                >
                  {currencies.map((item) => {
                    const selected = item === currency;

                    return (
                      <li key={item} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          disabled={pending}
                          className={
                            selected ? selectedItemClassName : idleItemClassName
                          }
                          onClick={() => {
                            if (item === currency) {
                              closeMenu();
                              return;
                            }
                            startTransition(async () => {
                              await setCurrencyAction(item);
                              router.refresh();
                              closeMenu();
                            });
                          }}
                        >
                          {item}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="min-w-0 flex-1">
                <p className="whitespace-nowrap px-3 pb-1 text-center text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
                  {languageLabel}
                </p>
                <ul
                  role="listbox"
                  aria-label={languageLabel}
                  className="px-1.5"
                >
                  {locales.map((item) => {
                    const href = replaceLocaleInPath(pathname, item);
                    const selected = item === locale;

                    return (
                      <li key={item} role="option" aria-selected={selected}>
                        <AppLink
                          href={href}
                          hrefLang={item}
                          prefetchPolicy="intent"
                          aria-label={`${localeShortLabels[item]}: ${localeLabels[item]}`}
                          className={
                            selected ? selectedItemClassName : idleItemClassName
                          }
                          onClick={closeMenu}
                        >
                          {localeLabels[item]}
                        </AppLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className="relative inline-flex w-[212px] shrink-0 items-center"
    >
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex h-[49px] w-full items-center justify-center gap-2 rounded-full bg-brand-surface px-6 text-base font-bold text-[#333] capitalize transition hover:bg-[#ececec]"
        aria-label={`${languageLabel} / ${currencyLabel}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggleMenu}
      >
        <Globe className="h-[18px] w-[18px] shrink-0" aria-hidden />
        <span>{localeShortLabels[locale]}</span>
        <span aria-hidden>/</span>
        <HeaderCurrencyIcon className="h-[12px] w-[20px] shrink-0" />
        <span>{currency}</span>
        <ChevronDown
          className={`ml-1 h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out ${
            open ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>

      {panel}
    </div>
  );
}
