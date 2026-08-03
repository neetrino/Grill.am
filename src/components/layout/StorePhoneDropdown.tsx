"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Phone } from "lucide-react";

import {
  DROPDOWN_ANIMATION_MS,
  DROPDOWN_PANEL_PORTAL_CLASS,
  DROPDOWN_OPTION_CLASS,
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
import { telHref } from "@/lib/phone";

type StorePhoneDropdownProps = {
  phones: readonly string[];
  toggleLabel: string;
  variant?: "footer" | "header" | "topbar";
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
    row: "flex items-center gap-3",
    icon: "h-[15px] w-[15px] shrink-0 text-[#FF4A12]",
    link: "leading-5 text-white/60 transition hover:text-white",
    chevron: "shrink-0 text-[#9C9FA1] transition hover:text-white",
    chevronIcon: "h-3.5 w-3.5",
    menuLink: `${DROPDOWN_OPTION_CLASS} hover:text-brand-red`,
  },
  header: {
    root: "relative z-20",
    row: "inline-flex items-center gap-2",
    icon: "h-[19px] w-[19px] shrink-0",
    link: "text-base font-medium text-[#333] transition hover:text-brand-red",
    chevron: "shrink-0 text-[#333] transition hover:text-brand-red",
    chevronIcon: "h-5 w-5",
    menuLink: `${DROPDOWN_OPTION_CLASS} hover:text-brand-red`,
  },
  topbar: {
    root: "relative z-20",
    row: "inline-flex items-center gap-2 text-gray-700",
    icon: "h-4 w-4 shrink-0",
    link: "font-medium transition-colors hover:text-brand-red",
    chevron: "shrink-0 text-gray-500 transition hover:text-brand-red",
    chevronIcon: "h-5 w-5",
    menuLink: `${DROPDOWN_OPTION_CLASS} hover:text-brand-red`,
  },
} as const;

export function StorePhoneDropdown({
  phones,
  toggleLabel,
  variant = "header",
}: StorePhoneDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [primary, ...rest] = phones;
  const styles = VARIANT_STYLES[variant];
  const showChevron = rest.length > 0;

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
      const maxWidth = Math.min(280, window.innerWidth - VIEWPORT_PADDING * 2);
      const minWidth = Math.min(Math.max(180, rect.width), maxWidth);
      const preferredLeft =
        variant === "footer" ? rect.left : rect.right - minWidth;
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

    const scheduleClose = () => {
      setVisible(false);
      clearCloseTimer();
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
        closeTimerRef.current = null;
      }, DROPDOWN_ANIMATION_MS);
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      scheduleClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        scheduleClose();
      }
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
            {rest.map((phone) => (
              <li key={phone}>
                <a href={telHref(phone)} className={styles.menuLink}>
                  {phone}
                </a>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={styles.root}>
      <div ref={anchorRef} className={styles.row}>
        <Phone className={styles.icon} aria-hidden />
        <div className="flex min-w-0 items-center gap-2">
          <a href={telHref(primary)} className={styles.link}>
            {primary}
          </a>
          {showChevron ? (
            <button
              ref={triggerRef}
              type="button"
              className={styles.chevron}
              aria-expanded={visible}
              aria-controls={listId}
              aria-label={toggleLabel}
              onClick={toggleMenu}
            >
              <ChevronDown
                className={`${styles.chevronIcon} transition-transform duration-150 ease-out motion-reduce:transition-none ${
                  visible ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      </div>
      {menu}
    </div>
  );
}
