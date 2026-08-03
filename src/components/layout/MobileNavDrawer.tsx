"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import {
  isStorefrontNavActive,
  type StorefrontNavItem,
} from "@/components/layout/storefront-nav";
import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";

type MobileNavDrawerProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  user: SessionUser | null;
  navItems: readonly StorefrontNavItem[];
};

export function MobileNavDrawer({
  locale,
  currency,
  dictionary,
  user,
  navItems,
}: MobileNavDrawerProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:h-10 sm:w-10 md:hidden"
        aria-label={dictionary.nav.openMenu}
        aria-expanded={open}
      >
        <Menu className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={dictionary.nav.navigation}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-full min-h-screen w-1/2 min-w-[16rem] max-w-full flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <p className="text-lg font-semibold text-gray-900">
                {dictionary.nav.navigation}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                aria-label={dictionary.nav.closeMenu}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto text-sm font-semibold uppercase tracking-wide text-gray-800">
              <div className="divide-y divide-gray-200">
                {navItems.map((item) => {
                  const active = isStorefrontNavActive(
                    pathname,
                    item,
                    locale,
                  );

                  return (
                    <AppLink
                      key={item.id}
                      href={item.href}
                      prefetchPolicy="intent"
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "flex items-center justify-between px-4 py-3 text-brand-red hover:bg-gray-50"
                          : "flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                      }
                      onClick={(event) => {
                        setOpen(false);
                        if (!active) {
                          return;
                        }
                        event.preventDefault();
                        window.scrollTo({
                          top: 0,
                          left: 0,
                          behavior: "smooth",
                        });
                      }}
                    >
                      {item.label}
                    </AppLink>
                  );
                })}

                {!user ? (
                  <>
                    <AppLink
                      href={`/${locale}/login`}
                      prefetchPolicy="intent"
                      className="flex items-center justify-between px-4 py-3 normal-case hover:bg-gray-50"
                      onClick={() => setOpen(false)}
                    >
                      {dictionary.header.login}
                    </AppLink>
                    <AppLink
                      href={`/${locale}/register`}
                      prefetchPolicy="intent"
                      className="flex items-center justify-between px-4 py-3 font-semibold normal-case text-gray-900 hover:bg-gray-900 hover:text-white"
                      onClick={() => setOpen(false)}
                    >
                      {dictionary.header.createAccount}
                    </AppLink>
                  </>
                ) : (
                  <AppLink
                    href={`/${locale}/profile`}
                    prefetchPolicy="intent"
                    className="flex items-center justify-between px-4 py-3 normal-case hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    {dictionary.header.profile}
                  </AppLink>
                )}
              </div>
            </nav>

            <div className="shrink-0 space-y-3 overflow-visible border-t border-gray-200 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium tracking-wide text-gray-500">
                  {dictionary.header.language}
                </span>
                <LocaleSwitcher
                  locale={locale}
                  label={dictionary.header.language}
                  menuPlacement="top"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium tracking-wide text-gray-500">
                  {dictionary.header.currency}
                </span>
                <CurrencySwitcher
                  currency={currency}
                  label={dictionary.header.currency}
                  menuPlacement="top"
                />
              </div>
              <p className="pt-1 text-xs font-medium tracking-wide text-gray-500">
                © {year} {dictionary.brand}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
