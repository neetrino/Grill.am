"use client";

import { ChevronDown, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import {
  isStorefrontNavActive,
  type StorefrontNavItem,
} from "@/components/layout/storefront-nav";
import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontNavCategory } from "@/features/categories/storefront-nav-category";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";

export type MobileNavPanelProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  user: SessionUser | null;
  navItems: readonly StorefrontNavItem[];
  categories: readonly StorefrontNavCategory[];
  categorySlug: string | null;
  onClose: () => void;
};

export function MobileNavPanel({
  locale,
  currency,
  dictionary,
  user,
  navItems,
  categories,
  categorySlug,
  onClose,
}: MobileNavPanelProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const year = new Date().getFullYear();
  const productsPath = `/${locale}/products`;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={dictionary.nav.navigation}
      onClick={onClose}
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
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
            aria-label={dictionary.nav.closeMenu}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto text-sm font-semibold uppercase tracking-wide text-gray-800">
          <div className="divide-y divide-gray-200">
            {navItems.map((item) => {
              if (item.kind === "categories") {
                const sectionActive =
                  pathname === productsPath && Boolean(categorySlug);

                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      className={
                        sectionActive || categoriesOpen
                          ? "flex w-full items-center justify-between px-4 py-3 text-left text-brand-red hover:bg-gray-50"
                          : "flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                      }
                      aria-expanded={categoriesOpen}
                      onClick={() => setCategoriesOpen((value) => !value)}
                    >
                      {item.label}
                      <ChevronDown
                        className={`size-4 transition ${
                          categoriesOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                    {categoriesOpen ? (
                      <div className="border-t border-gray-100 bg-gray-50 normal-case">
                        <AppLink
                          href={productsPath}
                          prefetchPolicy="intent"
                          className={
                            pathname === productsPath && !categorySlug
                              ? "block px-6 py-2.5 text-brand-red"
                              : "block px-6 py-2.5 text-gray-700 hover:bg-gray-100"
                          }
                          onClick={onClose}
                        >
                          {dictionary.nav.allCategories}
                        </AppLink>
                        {categories.map((category) => {
                          const href = `${productsPath}?category=${encodeURIComponent(category.slug)}`;
                          const active = categorySlug === category.slug;
                          return (
                            <AppLink
                              key={category.id}
                              href={href}
                              prefetchPolicy="intent"
                              className={
                                active
                                  ? "block px-6 py-2.5 text-brand-red"
                                  : "block px-6 py-2.5 text-gray-700 hover:bg-gray-100"
                              }
                              onClick={onClose}
                            >
                              {category.title}
                            </AppLink>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              const active = isStorefrontNavActive(pathname, item, locale, {
                categorySlug,
              });

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
                    onClose();
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
                  onClick={onClose}
                >
                  {dictionary.header.login}
                </AppLink>
                <AppLink
                  href={`/${locale}/register`}
                  prefetchPolicy="intent"
                  className="flex items-center justify-between px-4 py-3 font-semibold normal-case text-gray-900 hover:bg-gray-900 hover:text-white"
                  onClick={onClose}
                >
                  {dictionary.header.createAccount}
                </AppLink>
              </>
            ) : (
              <AppLink
                href={`/${locale}/profile`}
                prefetchPolicy="intent"
                className="flex items-center justify-between px-4 py-3 normal-case hover:bg-gray-50"
                onClick={onClose}
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
  );
}
