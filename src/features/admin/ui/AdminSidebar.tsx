"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getAdminMenuItems,
  isAdminTabActive,
  type AdminMenuItem,
} from "@/features/admin/ui/admin-menu.config";
import { AdminBrandLogo } from "@/features/admin/ui/AdminBrandLogo";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminMenuDrawer } from "@/features/admin/ui/AdminMenuDrawer";
import { AdminSidebarBrand } from "@/features/admin/ui/AdminSidebarBrand";
import { useAdminSidebarCollapse } from "@/features/admin/ui/AdminSidebarCollapseContext";
import {
  ADMIN_SIDEBAR_ASIDE,
  ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP,
  ADMIN_SIDEBAR_NAV,
} from "@/features/admin/ui/admin-shell-classes";
import {
  ADMIN_NAV_ACTIVE_CLASS,
  ADMIN_NAV_ICON_ACTIVE_CLASS,
  ADMIN_NAV_ICON_INACTIVE_CLASS,
  ADMIN_NAV_INACTIVE_CLASS,
  ADMIN_NAV_ROW_BASE_CLASS,
} from "@/features/admin/ui/admin-ui";
import { useAdminProductsSubnavExpanded } from "@/features/admin/ui/useAdminProductsSubnavExpanded";

type AdminSidebarProps = {
  locale: string;
};

function isNestedVisible(
  tab: AdminMenuItem,
  pathname: string,
  locale: string,
  collapsed: boolean,
  productsNestedExpanded: boolean,
): boolean {
  if (tab.parentGroupId !== "products") return true;
  if (collapsed) return true;
  if (isAdminTabActive(tab.href, pathname, locale)) return true;
  return productsNestedExpanded;
}

function isProductsGroupActive(
  tabs: AdminMenuItem[],
  pathname: string,
  locale: string,
): boolean {
  return tabs.some(
    (tab) =>
      (tab.id === "products" || tab.parentGroupId === "products") &&
      isAdminTabActive(tab.href, pathname, locale),
  );
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const pathname = usePathname() ?? `/${locale}/admin`;
  const dictionary = useAdminDictionary();
  const tabs = getAdminMenuItems(locale, dictionary.menu);
  const { collapsed } = useAdminSidebarCollapse();
  const [productsNestedExpanded, toggleProductsNested] =
    useAdminProductsSubnavExpanded(pathname, locale);
  const productsGroupActive = isProductsGroupActive(tabs, pathname, locale);

  const asideWidthClass = collapsed ? "lg:w-16" : "lg:w-64";

  return (
    <>
      <div className={ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP}>
        <div className="flex items-center justify-between gap-3">
          <AdminBrandLogo
            locale={locale}
            brandName={dictionary.menu.brandName}
            storeHomeLabel={dictionary.menu.storeHome}
          />
          <AdminMenuDrawer locale={locale} pathname={pathname} />
        </div>
      </div>
      <aside className={`${ADMIN_SIDEBAR_ASIDE} ${asideWidthClass}`}>
        <AdminSidebarBrand locale={locale} />
        <nav
          className={`${ADMIN_SIDEBAR_NAV} ${collapsed ? "px-1" : "px-2"}`}
        >
          {tabs.map((tab) => {
            if (
              !isNestedVisible(
                tab,
                pathname,
                locale,
                collapsed,
                productsNestedExpanded,
              )
            ) {
              return null;
            }

            const isActive =
              tab.id === "products"
                ? productsGroupActive
                : isAdminTabActive(tab.href, pathname, locale);
            const rowTone = isActive
              ? ADMIN_NAV_ACTIVE_CLASS
              : ADMIN_NAV_INACTIVE_CLASS;
            const iconTone = isActive
              ? ADMIN_NAV_ICON_ACTIVE_CLASS
              : ADMIN_NAV_ICON_INACTIVE_CLASS;

            if (tab.id === "products" && !collapsed) {
              return (
                <div
                  key={tab.id}
                  className={`relative ${ADMIN_NAV_ROW_BASE_CLASS} ${rowTone}`}
                >
                  <Link
                    href={tab.href}
                    className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-12 pl-4"
                  >
                    <span className={`shrink-0 ${iconTone}`}>{tab.icon}</span>
                    <span className="min-w-0 truncate">{tab.label}</span>
                  </Link>
                  <button
                    type="button"
                    aria-expanded={productsNestedExpanded}
                    aria-label={dictionary.menu.toggleProductSubpages}
                    onClick={(event) => {
                      event.preventDefault();
                      toggleProductsNested();
                    }}
                    className={`absolute top-0 right-0 bottom-0 inline-flex w-11 items-center justify-center rounded-r-[15px] transition-colors ${
                      isActive
                        ? "text-brand-red hover:bg-brand-red/5"
                        : "text-gray-600 hover:bg-black/5"
                    }`}
                  >
                    <svg
                      className={`h-5 w-5 transition-transform ${productsNestedExpanded ? "" : "-rotate-90"}`}
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
                className={`${ADMIN_NAV_ROW_BASE_CLASS} ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
                } ${tab.isSubCategory && !collapsed ? "pl-12" : ""} ${rowTone}`}
              >
                <span className={`shrink-0 ${iconTone}`}>{tab.icon}</span>
                {collapsed ? null : (
                  <span className="min-w-0 truncate">{tab.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
