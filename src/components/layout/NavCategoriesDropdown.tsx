"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AppLink } from "@/components/ui/AppLink";
import {
  DROPDOWN_OPTION_CLASS,
  DROPDOWN_OPTION_SELECTED_CLASS,
  DROPDOWN_PANEL_PORTAL_CLASS,
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
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

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

const CLOSE_DELAY_MS = 120;
const VIEWPORT_PADDING = 16;

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
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const productsPath = `/${locale}/products`;
  const triggerActive = isOnProductsList && Boolean(activeCategorySlug);
  const open = mounted && visible;

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

    function updatePosition(): void {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const minWidth = Math.min(
        Math.max(220, rect.width),
        window.innerWidth - VIEWPORT_PADDING * 2,
      );
      const left = Math.max(
        VIEWPORT_PADDING,
        Math.min(rect.left, window.innerWidth - minWidth - VIEWPORT_PADDING),
      );
      setMenuPosition({
        top: rect.bottom + 8,
        left,
        minWidth,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted]);

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

      {mounted && menuPosition
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={label}
              className={`${DROPDOWN_PANEL_PORTAL_CLASS} overflow-hidden py-1.5 ${dropdownPanelStateClass(visible)}`}
              style={dropdownPortalStyle(menuPosition)}
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
            document.body,
          )
        : null}
    </div>
  );
}
