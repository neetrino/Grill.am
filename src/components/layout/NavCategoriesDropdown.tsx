"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getDropdownPortalRoot } from "@/components/ui/dropdown-portal-root";

import { AppLink } from "@/components/ui/AppLink";
import {
  DROPDOWN_OPTION_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
  DROPDOWN_PANEL_PORTAL_CLASS,
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
import { useDropdownPortalPosition } from "@/components/ui/use-dropdown-portal-position";
import type { StorefrontNavCategory } from "@/features/categories/storefront-nav-category";
import {
  CatalogAllCategoriesIcon,
  resolveCatalogCategoryIcon,
} from "@/features/products/ui/catalog-category-icon";
import type { Locale } from "@/lib/i18n/config";

type NavCategoriesDropdownProps = {
  locale: Locale;
  label: string;
  categories: readonly StorefrontNavCategory[];
  allLabel: string;
  activeCategorySlug: string | null;
  isOnProductsList: boolean;
  /** Highlight Menu when on any products route. */
  isMenuActive?: boolean;
};

const CLOSE_DELAY_MS = 120;
const NAV_MENU_GAP_PX = 8;
const NAV_MENU_MIN_WIDTH_PX = 280;
const DROPDOWN_OPTION_ROW_CLASS = "dropdown-option--row";

function menuOptionClass(active: boolean): string {
  return `${DROPDOWN_OPTION_CLASS} ${DROPDOWN_OPTION_ROW_CLASS} group font-medium hover:text-brand-red ${
    active
      ? `${DROPDOWN_OPTION_SELECTED_CLASS} text-brand-red`
      : "text-[#101010]"
  }`;
}

function MenuOptionIcon({
  Icon,
  active,
}: {
  Icon: LucideIcon;
  active: boolean;
}) {
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-[12px] transition-colors ${
        active
          ? "bg-[#fff1eb] text-brand-red"
          : "bg-[#f5f5f5] text-[#8a8a8a] group-hover:bg-[#fff1eb] group-hover:text-brand-red"
      }`}
      aria-hidden
    >
      <Icon className="size-[18px]" strokeWidth={1.9} />
    </span>
  );
}

export function NavCategoriesDropdown({
  locale,
  label,
  categories,
  allLabel,
  activeCategorySlug,
  isOnProductsList,
  isMenuActive = false,
}: NavCategoriesDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const productsPath = `/${locale}/products`;
  const triggerActive = isMenuActive;
  const open = mounted && visible;
  const allActive = isOnProductsList && !activeCategorySlug;
  const menuPosition = useDropdownPortalPosition(mounted, triggerRef, {
    matchTriggerWidth: false,
    panelWidthPx: NAV_MENU_MIN_WIDTH_PX,
    gapPx: NAV_MENU_GAP_PX,
  });

  function clearCloseTimer(): void {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMenu(): void {
    clearCloseTimer();
    setMounted(true);
    setVisible(true);
  }

  function scheduleClose(): void {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setMounted(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }

  function closeMenu(): void {
    clearCloseTimer();
    setVisible(false);
    setMounted(false);
  }

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        clearCloseTimer();
        setVisible(false);
        setMounted(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mounted]);

  const portalStyle = menuPosition
    ? dropdownPortalStyle({
        ...menuPosition,
        minWidth: Math.max(
          menuPosition.minWidth ?? 0,
          NAV_MENU_MIN_WIDTH_PX,
        ),
      })
    : undefined;

  return (
    <div
      ref={rootRef}
      className="relative inline-flex items-center"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <AppLink
        ref={triggerRef}
        href={productsPath}
        prefetchPolicy="intent"
        className={`inline-flex items-center gap-1 rounded-[10px] px-4 py-2 text-base font-semibold whitespace-nowrap transition ${
          triggerActive || open
            ? "text-brand-red"
            : "text-[#101010] hover:text-brand-red"
        }`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-current={triggerActive ? "page" : undefined}
        onFocus={openMenu}
        onClick={(event) => {
          if (isOnProductsList && !activeCategorySlug) {
            event.preventDefault();
            scheduleClose();
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            return;
          }
          scheduleClose();
        }}
      >
        {label}
        <ChevronDown
          className={`size-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </AppLink>

      {mounted && menuPosition && portalStyle
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={label}
              className={`${DROPDOWN_PANEL_PORTAL_CLASS} !max-h-[min(70vh,380px)] overflow-y-auto py-2 shadow-[0_12px_32px_rgba(16,16,16,0.12)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${dropdownPanelStateClass(visible)}`}
              style={portalStyle}
              onMouseEnter={openMenu}
              onMouseLeave={scheduleClose}
            >
              <AppLink
                href={productsPath}
                prefetchPolicy="intent"
                role="menuitem"
                className={menuOptionClass(allActive)}
                onClick={closeMenu}
              >
                <MenuOptionIcon
                  Icon={CatalogAllCategoriesIcon}
                  active={allActive}
                />
                <span className="min-w-0 truncate">{allLabel}</span>
              </AppLink>
              {categories.length > 0 ? (
                <div
                  className="mx-3 my-1.5 h-px bg-[#f0f1f3]"
                  role="separator"
                />
              ) : null}
              {categories.map((category, index) => {
                const href = `${productsPath}?category=${encodeURIComponent(category.slug)}`;
                const active = activeCategorySlug === category.slug;
                const Icon = resolveCatalogCategoryIcon(
                  category.slug,
                  category.title,
                  index,
                );
                return (
                  <AppLink
                    key={category.id}
                    href={href}
                    prefetchPolicy="intent"
                    role="menuitem"
                    className={menuOptionClass(active)}
                    onClick={closeMenu}
                  >
                    <MenuOptionIcon Icon={Icon} active={active} />
                    <span className="min-w-0 truncate">{category.title}</span>
                  </AppLink>
                );
              })}
            </div>,
            getDropdownPortalRoot(),
          )
        : null}
    </div>
  );
}
