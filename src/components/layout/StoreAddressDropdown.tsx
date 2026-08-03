"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, MapPin } from "lucide-react";

import {
  DROPDOWN_ANIMATION_MS,
  DROPDOWN_PANEL_PORTAL_CLASS,
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";

type StoreAddressDropdownProps = {
  addresses: readonly string[];
  toggleLabel: string;
  variant?: "footer" | "header";
};

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
  maxWidth: number;
};

const VIEWPORT_PADDING = 16;

const VARIANT_STYLES = {
  footer: {
    root: "relative z-20",
    row: "flex items-start gap-3",
    icon: "mt-0.5 h-[15px] w-[15px] shrink-0 text-[#FF4A12]",
    text: "leading-5 text-white/60",
    chevron: "mt-0.5 shrink-0 text-[#9C9FA1] transition hover:text-white",
    chevronIcon: "h-[18px] w-[18px]",
    item: "px-4 py-3 text-sm leading-5 text-gray-800",
  },
  header: {
    root: "relative z-20",
    row: "inline-flex items-center gap-2",
    icon: "h-[19px] w-[15px] shrink-0",
    text: "text-base font-medium text-[#333]",
    chevron: "shrink-0 text-[#333] transition hover:text-brand-red",
    chevronIcon: "h-5 w-5",
    item: "px-4 py-3 text-sm leading-5 text-gray-800",
  },
} as const;

export function StoreAddressDropdown({
  addresses,
  toggleLabel,
  variant = "footer",
}: StoreAddressDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [primary, ...rest] = addresses;
  const styles = VARIANT_STYLES[variant];
  const isHeader = variant === "header";
  const displayLabel = isHeader ? toggleLabel : primary;
  const menuAddresses = isHeader ? addresses : rest;
  const showChevron = isHeader ? addresses.length > 0 : rest.length > 0;

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
    }, DROPDOWN_ANIMATION_MS);
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
      const maxWidth = Math.min(360, window.innerWidth - VIEWPORT_PADDING * 2);
      const minWidth = Math.min(Math.max(220, rect.width), maxWidth);
      const preferredLeft =
        variant === "header" ? rect.right - minWidth : rect.left;
      const left = Math.max(
        VIEWPORT_PADDING,
        Math.min(preferredLeft, window.innerWidth - minWidth - VIEWPORT_PADDING),
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
      }, DROPDOWN_ANIMATION_MS);
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
      }, DROPDOWN_ANIMATION_MS);
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
  }, [mounted, variant]);

  if (!primary) {
    return null;
  }

  const menu =
    mounted && showChevron && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            className={`${DROPDOWN_PANEL_PORTAL_CLASS} ${dropdownPanelStateClass(visible)}`}
            style={dropdownPortalStyle(menuPosition)}
          >
            {menuAddresses.map((address) => (
              <li key={address} className={`${styles.item} break-words whitespace-normal`}>
                {address}
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={styles.root}>
      <div ref={anchorRef} className={styles.row}>
        <MapPin className={styles.icon} aria-hidden />
        {showChevron ? (
          <button
            ref={triggerRef}
            type="button"
            className={`flex min-w-0 items-center gap-2 ${styles.chevron}`}
            aria-expanded={visible}
            aria-controls={listId}
            aria-label={toggleLabel}
            onClick={toggleMenu}
          >
            <span className={styles.text}>{displayLabel}</span>
            <ChevronDown
              className={`${styles.chevronIcon} shrink-0 transition-transform duration-150 ease-out motion-reduce:transition-none ${
                visible ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
        ) : (
          <span className={styles.text}>{displayLabel}</span>
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
