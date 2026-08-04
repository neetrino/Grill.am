"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  getAdminMenuItems,
  isAdminTabActive,
  type AdminMenuItem,
} from "@/features/admin/ui/admin-menu.config";
import { AdminBrandLogo } from "@/features/admin/ui/AdminBrandLogo";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_DRAWER_EASE_CLASS,
  ADMIN_DRAWER_TRANSITION_MS,
  ADMIN_NAV_ACTIVE_CLASS,
  ADMIN_NAV_INACTIVE_CLASS,
} from "@/features/admin/ui/admin-ui";
import { useAdminProductsSubnavExpanded } from "@/features/admin/ui/useAdminProductsSubnavExpanded";

type AdminMenuDrawerProps = {
  locale: string;
  pathname: string;
};

function isNestedVisible(
  tab: AdminMenuItem,
  pathname: string,
  locale: string,
  productsNestedExpanded: boolean,
): boolean {
  if (tab.parentGroupId !== "products") return true;
  if (isAdminTabActive(tab.href, pathname, locale)) return true;
  return productsNestedExpanded;
}

export function AdminMenuDrawer({ locale, pathname }: AdminMenuDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const dictionary = useAdminDictionary();
  const tabs = getAdminMenuItems(locale, dictionary.menu);
  const [productsNestedExpanded, toggleProductsNested] =
    useAdminProductsSubnavExpanded(pathname, locale);

  const closeDrawer = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => {
      setMounted(false);
    }, ADMIN_DRAWER_TRANSITION_MS);
  }, []);

  const openDrawer = useCallback(() => {
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });
  }, []);

  useEffect(() => {
    if (!mounted) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={visible}
        aria-controls="admin-menu-drawer-panel"
        onClick={() => {
          if (visible) {
            closeDrawer();
            return;
          }
          openDrawer();
        }}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-800 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6H20M4 12H16M4 18H12"
          />
        </svg>
        {dictionary.menu.openMenu}
      </button>

      {mounted ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeDrawer}
          />
          <div
            id="admin-menu-drawer-panel"
            className={`relative flex h-full min-h-screen w-1/2 min-w-[16rem] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ${ADMIN_DRAWER_EASE_CLASS} ${
              visible ? "translate-x-0" : "-translate-x-full"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={dictionary.menu.openMenu}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-4">
              <AdminBrandLogo
                locale={locale}
                brandName={dictionary.menu.brandName}
                storeHomeLabel={dictionary.menu.storeHome}
                onNavigate={closeDrawer}
              />
              <button
                type="button"
                onClick={closeDrawer}
                className="h-10 w-10 rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                aria-label={dictionary.menu.closeMenu}
              >
                <svg
                  className="mx-auto h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
              {tabs.map((tab) => {
                if (
                  !isNestedVisible(
                    tab,
                    pathname,
                    locale,
                    productsNestedExpanded,
                  )
                ) {
                  return null;
                }

                const isActive = isAdminTabActive(tab.href, pathname, locale);

                if (tab.id === "products") {
                  return (
                    <div
                      key={tab.id}
                      className={`flex w-full overflow-hidden rounded-[15px] transition-colors ${
                        isActive ? ADMIN_NAV_ACTIVE_CLASS : ""
                      }`}
                    >
                      <Link
                        href={tab.href}
                        onClick={closeDrawer}
                        className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-sm font-medium ${
                          isActive
                            ? "text-brand-red"
                            : "text-gray-700 hover:bg-gray-50"
                        } ${tab.isSubCategory ? "pl-10" : ""}`}
                      >
                        <span className="shrink-0">{tab.icon}</span>
                        <span className="truncate">{tab.label}</span>
                      </Link>
                      <button
                        type="button"
                        aria-expanded={productsNestedExpanded}
                        aria-label={dictionary.menu.toggleProductSubpages}
                        onClick={toggleProductsNested}
                        className={`shrink-0 border-l px-3 py-3 ${
                          isActive
                            ? "border-brand-red/20 text-brand-red"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        <svg
                          className={`h-5 w-5 transition-transform duration-200 ${productsNestedExpanded ? "" : "-rotate-90"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                }

                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={closeDrawer}
                    className={`flex items-center gap-3 rounded-[15px] px-4 py-3 text-sm font-medium transition-colors ${
                      tab.isSubCategory ? "pl-10" : ""
                    } ${
                      isActive
                        ? ADMIN_NAV_ACTIVE_CLASS
                        : ADMIN_NAV_INACTIVE_CLASS
                    }`}
                  >
                    <span className="shrink-0">{tab.icon}</span>
                    <span className="truncate">{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
