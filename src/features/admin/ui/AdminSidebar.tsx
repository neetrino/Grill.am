"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

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
import styles from "@/features/admin/ui/AdminSidebarNav.module.css";
import {
  ADMIN_SIDEBAR_ASIDE,
  ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP,
  ADMIN_SIDEBAR_NAV,
} from "@/features/admin/ui/admin-shell-classes";
import {
  ADMIN_NAV_ACTIVE_TEXT_CLASS,
  ADMIN_NAV_ICON_ACTIVE_CLASS,
  ADMIN_NAV_ICON_INACTIVE_CLASS,
  ADMIN_NAV_INACTIVE_CLASS,
  ADMIN_NAV_INDICATOR,
  ADMIN_NAV_ROW_BASE_CLASS,
  ADMIN_NAV_TRANSITION_MS,
} from "@/features/admin/ui/admin-ui";
import { useAdminProductsSubnavExpanded } from "@/features/admin/ui/useAdminProductsSubnavExpanded";

type AdminSidebarProps = {
  locale: string;
};

type IndicatorBox = {
  top: number;
  height: number;
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

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const pathname = usePathname() ?? `/${locale}/admin`;
  const dictionary = useAdminDictionary();
  const tabs = getAdminMenuItems(locale, dictionary.menu);
  const { collapsed } = useAdminSidebarCollapse();
  const [productsNestedExpanded, toggleProductsNested] =
    useAdminProductsSubnavExpanded(pathname, locale);

  const navRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null);
  const [slideEnabled, setSlideEnabled] = useState(false);

  const activeTab =
    tabs.find((tab) => isAdminTabActive(tab.href, pathname, locale)) ?? null;
  const activeId = activeTab?.id ?? "";
  const visibleTabIds = tabs
    .filter((tab) =>
      isNestedVisible(
        tab,
        pathname,
        locale,
        collapsed,
        productsNestedExpanded,
      ),
    )
    .map((tab) => tab.id)
    .join("|");

  useLayoutEffect(() => {
    const row = rowRefs.current.get(activeId);
    if (!row) {
      return;
    }
    setIndicator({
      top: row.offsetTop,
      height: row.offsetHeight,
    });
  }, [activeId, visibleTabIds, collapsed]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setSlideEnabled(true);
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === "undefined") {
      return;
    }
    const update = () => {
      const row = rowRefs.current.get(activeId);
      if (!row) {
        return;
      }
      setIndicator({
        top: row.offsetTop,
        height: row.offsetHeight,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    for (const row of rowRefs.current.values()) {
      observer.observe(row);
    }
    return () => {
      observer.disconnect();
    };
  }, [activeId, visibleTabIds, collapsed]);

  const asideWidthClass = collapsed ? "lg:w-16" : "lg:w-64";
  const asideTransition = `width ${ADMIN_NAV_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;

  function setRowRef(id: string, node: HTMLElement | null): void {
    if (node) {
      rowRefs.current.set(id, node);
      return;
    }
    rowRefs.current.delete(id);
  }

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
      <aside
        className={`${ADMIN_SIDEBAR_ASIDE} ${asideWidthClass}`}
        style={{ transition: asideTransition }}
      >
        <AdminSidebarBrand locale={locale} />
        <nav
          ref={navRef}
          className={`relative ${ADMIN_SIDEBAR_NAV} ${collapsed ? "px-1" : "px-2"}`}
          style={
            {
              "--admin-nav-ms": `${ADMIN_NAV_TRANSITION_MS}ms`,
            } as CSSProperties
          }
        >
          {indicator ? (
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-x-0 z-0 rounded-[15px] border-l-4 ${
                slideEnabled ? styles.indicator : styles.indicatorInstant
              }`}
              style={{
                top: indicator.top,
                height: indicator.height,
                backgroundColor: ADMIN_NAV_INDICATOR.background,
                borderLeftColor: ADMIN_NAV_INDICATOR.border,
              }}
            />
          ) : null}

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

            const isActive = isAdminTabActive(tab.href, pathname, locale);
            const iconTone = isActive
              ? ADMIN_NAV_ICON_ACTIVE_CLASS
              : ADMIN_NAV_ICON_INACTIVE_CLASS;
            const labelTone = isActive
              ? ADMIN_NAV_ACTIVE_TEXT_CLASS
              : "text-inherit";

            if (tab.id === "products" && !collapsed) {
              return (
                <div
                  key={tab.id}
                  ref={(node) => setRowRef(tab.id, node)}
                  className={`relative ${ADMIN_NAV_ROW_BASE_CLASS} ${
                    isActive ? "" : ADMIN_NAV_INACTIVE_CLASS
                  }`}
                >
                  <Link
                    href={tab.href}
                    className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-12 pl-4"
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={`shrink-0 ${iconTone}`}>{tab.icon}</span>
                    <span
                      className={`${styles.tabLabel} min-w-0 truncate font-medium ${labelTone}`}
                    >
                      {tab.label}
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-expanded={productsNestedExpanded}
                    aria-label={dictionary.menu.toggleProductSubpages}
                    onClick={(event) => {
                      event.preventDefault();
                      toggleProductsNested();
                    }}
                    className={`absolute top-0 right-0 bottom-0 z-10 inline-flex w-11 items-center justify-center rounded-r-[15px] transition-colors ${
                      isActive
                        ? "text-brand-red hover:bg-brand-red/5"
                        : "text-gray-600 hover:bg-black/5"
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
                ref={(node) => setRowRef(tab.id, node)}
                aria-current={isActive ? "page" : undefined}
                className={`${ADMIN_NAV_ROW_BASE_CLASS} ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
                } ${tab.isSubCategory && !collapsed ? "pl-12" : ""} ${
                  isActive ? "" : ADMIN_NAV_INACTIVE_CLASS
                }`}
              >
                <span className={`shrink-0 ${iconTone}`}>{tab.icon}</span>
                {collapsed ? null : (
                  <span
                    className={`${styles.tabLabel} min-w-0 truncate font-medium ${labelTone}`}
                  >
                    {tab.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
