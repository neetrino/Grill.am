"use client";

import { ChevronDown } from "lucide-react";
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
import type { Locale } from "@/lib/i18n/config";

type NavCategoriesDropdownProps = {
  locale: Locale;
  label: string;
  categories: readonly StorefrontNavCategory[];
  allLabel: string;
  activeCategorySlug: string | null;
  isOnProductsList: boolean;
};

const CLOSE_DELAY_MS = 120;
const NAV_MENU_GAP_PX = 8;
const NAV_MENU_MIN_WIDTH_PX = 220;

export function NavCategoriesDropdown({
  locale,
  label,
  categories,
  allLabel,
  activeCategorySlug,
  isOnProductsList,
}: NavCategoriesDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const productsPath = `/${locale}/products`;
  const triggerActive = isOnProductsList && Boolean(activeCategorySlug);
  const open = mounted && visible;
  const menuPosition = useDropdownPortalPosition(mounted, triggerRef, {
    matchTriggerWidth: true,
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
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex items-center gap-1 rounded-[10px] px-4 py-2 text-base font-semibold whitespace-nowrap transition ${
          triggerActive || open
            ? "text-brand-red"
            : "text-[#101010] hover:text-brand-red"
        }`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onFocus={openMenu}
        onClick={() => {
          if (open) {
            scheduleClose();
            return;
          }
          openMenu();
        }}
      >
        {label}
        <ChevronDown
          className={`size-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {mounted && menuPosition && portalStyle
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={label}
              className={`${DROPDOWN_PANEL_PORTAL_CLASS} overflow-hidden py-1.5 ${dropdownPanelStateClass(visible)}`}
              style={portalStyle}
              onMouseEnter={openMenu}
              onMouseLeave={scheduleClose}
            >
              <AppLink
                href={productsPath}
                prefetchPolicy="intent"
                role="menuitem"
                className={`${DROPDOWN_OPTION_CLASS} font-medium hover:text-brand-red ${
                  isOnProductsList && !activeCategorySlug
                    ? `${DROPDOWN_OPTION_SELECTED_CLASS} text-brand-red`
                    : "text-[#101010]"
                }`}
                onClick={() => {
                  clearCloseTimer();
                  setVisible(false);
                  setMounted(false);
                }}
              >
                {allLabel}
              </AppLink>
              {categories.map((category) => {
                const href = `${productsPath}?category=${encodeURIComponent(category.slug)}`;
                const active = activeCategorySlug === category.slug;
                return (
                  <AppLink
                    key={category.id}
                    href={href}
                    prefetchPolicy="intent"
                    role="menuitem"
                    className={`${DROPDOWN_OPTION_CLASS} font-medium hover:text-brand-red ${
                      active
                        ? `${DROPDOWN_OPTION_SELECTED_CLASS} text-brand-red`
                        : "text-[#101010]"
                    }`}
                    onClick={() => {
                      clearCloseTimer();
                      setVisible(false);
                      setMounted(false);
                    }}
                  >
                    {category.title}
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
