"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  DROPDOWN_ANIMATION_MS,
  DROPDOWN_PANEL_ANCHORED_CLASS,
  DROPDOWN_PANEL_CLASS,
  dropdownPanelStateClass,
} from "@/components/ui/dropdown-styles";

type IconDropdownProps = {
  label: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  triggerClassName?: string;
  /** Where the menu opens relative to the trigger. Default: below. */
  menuPlacement?: "bottom" | "top";
  /** Horizontal alignment of the panel under the trigger. Default: right. */
  menuAlign?: "left" | "right";
};

/** Bridges the gap between trigger and panel so hover does not flicker. */
const HOVER_CLOSE_DELAY_MS = 120;

export function IconDropdown({
  label,
  trigger,
  children,
  triggerClassName,
  menuPlacement = "bottom",
  menuAlign = "right",
}: IconDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  const clearCloseTimer = useCallback((): void => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const clearUnmountTimer = useCallback((): void => {
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback((): void => {
    clearCloseTimer();
    clearUnmountTimer();
    setOpen(true);
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, [clearCloseTimer, clearUnmountTimer]);

  const closeMenu = useCallback((): void => {
    clearCloseTimer();
    clearUnmountTimer();
    setOpen(false);
    setVisible(false);
    unmountTimerRef.current = setTimeout(() => {
      setMounted(false);
      unmountTimerRef.current = null;
    }, DROPDOWN_ANIMATION_MS);
  }, [clearCloseTimer, clearUnmountTimer]);

  const scheduleClose = useCallback((): void => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      closeMenu();
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer, closeMenu]);

  function toggleMenu(): void {
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }

  useEffect(() => {
    return () => {
      clearCloseTimer();
      clearUnmountTimer();
    };
  }, [clearCloseTimer, clearUnmountTimer]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeMenu]);

  const placementClass =
    menuPlacement === "top" ? "bottom-full mb-[6px] top-auto" : "";
  const alignClass =
    menuAlign === "left" ? "!left-0 !right-auto" : "!right-0 !left-auto";

  return (
    <div
      ref={rootRef}
      className={
        open
          ? "relative z-50 inline-flex items-center"
          : "relative inline-flex items-center"
      }
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={
          triggerClassName ??
          "inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200/90 bg-gray-100 px-3 text-gray-800 shadow-sm transition-colors hover:bg-gray-200/90"
        }
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggleMenu}
        onFocus={openMenu}
      >
        {trigger}
      </button>

      {mounted ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={`${DROPDOWN_PANEL_ANCHORED_CLASS} ${alignClass} min-w-40 overflow-hidden ${placementClass} ${dropdownPanelStateClass(visible)}`}
        >
          <div
            onClick={(event) => {
              const target = event.target;
              if (
                target instanceof Element &&
                target.closest("form, button[type='submit']")
              ) {
                return;
              }
              closeMenu();
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") {
                return;
              }
              const target = event.target;
              if (
                target instanceof Element &&
                target.closest("form, button[type='submit']")
              ) {
                return;
              }
              closeMenu();
            }}
          >
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Re-export panel class for menus that compose custom children. */
export { DROPDOWN_PANEL_CLASS };
