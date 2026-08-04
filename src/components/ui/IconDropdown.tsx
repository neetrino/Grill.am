"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { getDropdownPortalRoot } from "@/components/ui/dropdown-portal-root";

import {
  DROPDOWN_ANIMATION_MS,
  DROPDOWN_PANEL_CLASS,
  DROPDOWN_PANEL_PORTAL_CLASS,
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
import { useDropdownPortalPosition } from "@/components/ui/use-dropdown-portal-position";

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

function subscribeNoop(): () => void {
  return () => undefined;
}

export function IconDropdown({
  label,
  trigger,
  children,
  triggerClassName,
  menuPlacement = "bottom",
  menuAlign = "right",
}: IconDropdownProps) {
  const canPortal = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const menuPosition = useDropdownPortalPosition(mounted, triggerRef, {
    matchTriggerWidth: false,
    align: menuAlign,
    placement: menuPlacement,
  });

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
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      closeMenu();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, closeMenu]);

  const panel =
    canPortal && mounted && menuPosition
      ? createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label={label}
            className={`${DROPDOWN_PANEL_PORTAL_CLASS} min-w-40 overflow-hidden ${dropdownPanelStateClass(visible)}`}
            style={dropdownPortalStyle(menuPosition)}
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
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
          </div>,
          getDropdownPortalRoot(),
        )
      : null;

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

      {panel}
    </div>
  );
}

/** Re-export panel class for menus that compose custom children. */
export { DROPDOWN_PANEL_CLASS };
