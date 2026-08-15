"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChevronDown, MapPin } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import {
  buildStoresPageHref,
  GRILL_STORE_LOCATIONS,
} from "@/features/stores/yandex-map-embed";
import type { Locale } from "@/lib/i18n/config";

type StoreAddressDropdownProps = {
  addresses: readonly string[];
  toggleLabel: string;
  variant?: "footer" | "header";
  /** Required for clickable address links to /stores. */
  locale?: Locale;
};

type MenuPosition = {
  top: number;
  left?: number;
  right?: number;
  minWidth: number;
  maxWidth: number;
};

const MENU_TRANSITION_MS = 200;
const VIEWPORT_PADDING = 16;
const HEADER_MENU_MAX_HEIGHT_PX = 220;
const HEADER_MENU_MAX_WIDTH_PX = 320;
const SCROLLBAR_HIDDEN_CLASS =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const HEADER_MENU_SCROLLBAR_CLASS = [
  "[scrollbar-width:thin]",
  "[scrollbar-color:#C4C4C4_transparent]",
  "[&::-webkit-scrollbar]:w-1.5",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:bg-[#C4C4C4]",
].join(" ");

const FOOTER_STYLES = {
  root: "relative z-20",
  row: "flex items-start gap-3",
  icon: "mt-0.5 h-[15px] w-[15px] shrink-0 text-brand-yellow",
  text: "leading-5 text-white/60",
  chevron: "mt-0.5 shrink-0 text-[#9C9FA1] transition hover:text-white",
  chevronIcon: "h-[18px] w-[18px]",
  menu: `fixed z-[400] max-h-[140px] origin-top space-y-1 overflow-y-auto rounded-[14px] border border-white/10 bg-black px-2 py-2 text-sm text-white/60 shadow-lg transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${SCROLLBAR_HIDDEN_CLASS}`,
  item: "block rounded-lg px-2.5 py-1.5 leading-5 break-words transition hover:bg-white/10 hover:text-white",
} as const;

export function StoreAddressDropdown({
  addresses,
  toggleLabel,
  variant = "footer",
  locale,
}: StoreAddressDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [primary, ...rest] = addresses;
  const isHeader = variant === "header";
  const displayLabel = isHeader ? toggleLabel : primary;
  const menuAddresses = isHeader ? addresses : rest;
  const showChevron = isHeader ? addresses.length > 0 : rest.length > 0;
  const linksEnabled = Boolean(locale);

  function setMenuRef(node: HTMLElement | null): void {
    menuRef.current = node;
  }

  function clearCloseTimer(): void {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMenu(): void {
    clearCloseTimer();
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }

  function closeMenu(): void {
    setVisible(false);
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
    }, MENU_TRANSITION_MS);
  }

  function toggleMenu(): void {
    if (visible) {
      closeMenu();
      return;
    }
    openMenu();
  }

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }
      const rect = anchor.getBoundingClientRect();

      if (isHeader) {
        const maxWidth = Math.min(
          HEADER_MENU_MAX_WIDTH_PX,
          window.innerWidth - VIEWPORT_PADDING * 2,
        );

        setMenuPosition({
          top: rect.bottom + 10,
          right: Math.max(
            VIEWPORT_PADDING,
            window.innerWidth - rect.right,
          ),
          minWidth: 0,
          maxWidth,
        });
        return;
      }

      const maxWidth = Math.min(360, window.innerWidth - VIEWPORT_PADDING * 2);
      const minWidth = Math.min(Math.max(220, rect.width), maxWidth);
      const left = Math.max(
        VIEWPORT_PADDING,
        Math.min(rect.left, window.innerWidth - minWidth - VIEWPORT_PADDING),
      );

      setMenuPosition({
        top: rect.bottom + 8,
        left,
        minWidth,
        maxWidth,
      });
    };

    updatePosition();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setVisible(false);
      clearCloseTimer();
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
        closeTimerRef.current = null;
      }, MENU_TRANSITION_MS);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      setVisible(false);
      clearCloseTimer();
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
        closeTimerRef.current = null;
      }, MENU_TRANSITION_MS);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, isHeader]);

  if (!primary) {
    return null;
  }

  const visibilityClass = visible
    ? "translate-y-0 opacity-100"
    : "pointer-events-none -translate-y-1 opacity-0";

  const menu =
    mounted && showChevron && menuPosition
      ? createPortal(
          isHeader ? (
            <div
              ref={setMenuRef}
              id={listId}
              className={`fixed z-[400] w-max origin-top-right transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${visibilityClass}`}
              style={{
                top: menuPosition.top,
                right: menuPosition.right,
                maxWidth: menuPosition.maxWidth,
              }}
            >
              <ul
                className={`relative overflow-y-auto overscroll-contain rounded-[12px] border border-[#E8E8E8] bg-white py-0.5 pr-0.5 shadow-[0_8px_24px_rgba(0,0,0,0.1)] ${HEADER_MENU_SCROLLBAR_CLASS}`}
                style={{ maxHeight: HEADER_MENU_MAX_HEIGHT_PX }}
              >
                {menuAddresses.map((address, menuIndex) => {
                  const store = GRILL_STORE_LOCATIONS[menuIndex];
                  const href =
                    linksEnabled && locale && store
                      ? buildStoresPageHref(locale, store.id)
                      : null;
                  const rowClass =
                    "flex w-full items-center gap-2.5 whitespace-nowrap px-3 py-2 text-left text-sm leading-snug font-medium text-[#333] transition-colors hover:bg-[#F7F0F0]";

                  return (
                    <li
                      key={address}
                      className={
                        menuIndex < menuAddresses.length - 1
                          ? "border-b border-[#EEE]"
                          : undefined
                      }
                    >
                      {href ? (
                        <AppLink
                          href={href}
                          prefetchPolicy="intent"
                          className={rowClass}
                          onClick={closeMenu}
                        >
                          <MapPin
                            className="size-4 shrink-0 text-brand-red"
                            aria-hidden
                          />
                          <span>{address}</span>
                        </AppLink>
                      ) : (
                        <span className={rowClass}>
                          <MapPin
                            className="size-4 shrink-0 text-brand-red"
                            aria-hidden
                          />
                          <span>{address}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <ul
              ref={setMenuRef}
              id={listId}
              className={`${FOOTER_STYLES.menu} ${visibilityClass}`}
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                minWidth: menuPosition.minWidth,
                maxWidth: menuPosition.maxWidth,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {menuAddresses.map((address, menuIndex) => {
                const store = GRILL_STORE_LOCATIONS[menuIndex + 1];
                const href =
                  linksEnabled && locale && store
                    ? buildStoresPageHref(locale, store.id)
                    : null;

                return (
                  <li key={address}>
                    {href ? (
                      <AppLink
                        href={href}
                        prefetchPolicy="intent"
                        className={FOOTER_STYLES.item}
                        onClick={closeMenu}
                      >
                        {address}
                      </AppLink>
                    ) : (
                      <span className={FOOTER_STYLES.item}>{address}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ),
          document.body,
        )
      : null;

  const triggerStyles = isHeader
    ? {
        row: "inline-flex items-center gap-2",
        icon: "h-[19px] w-[15px] shrink-0",
        text: "text-base font-medium text-[#333]",
        chevron: "shrink-0 text-[#333] transition hover:text-brand-red",
        chevronIcon: "h-5 w-5",
      }
    : FOOTER_STYLES;

  return (
    <div ref={rootRef} className={isHeader ? "relative z-20" : FOOTER_STYLES.root}>
      <div ref={anchorRef} className={triggerStyles.row}>
        <MapPin className={triggerStyles.icon} aria-hidden />
        {showChevron ? (
          <button
            ref={triggerRef}
            type="button"
            className={`flex min-w-0 items-center gap-2 ${triggerStyles.chevron}`}
            aria-expanded={visible}
            aria-controls={listId}
            aria-label={toggleLabel}
            onClick={toggleMenu}
          >
            <span className={triggerStyles.text}>{displayLabel}</span>
            <ChevronDown
              className={`${triggerStyles.chevronIcon} shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                visible ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
        ) : (
          <span className={triggerStyles.text}>{displayLabel}</span>
        )}
      </div>
      {menu}
    </div>
  );
}

/** @deprecated Prefer StoreAddressDropdown — kept for existing footer import path. */
export function FooterAddressDropdown(props: StoreAddressDropdownProps) {
  return <StoreAddressDropdown {...props} variant="footer" />;
}
