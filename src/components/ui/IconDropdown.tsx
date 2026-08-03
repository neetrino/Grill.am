"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
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
};

export function IconDropdown({
  label,
  trigger,
  children,
  triggerClassName,
  menuPlacement = "bottom",
}: IconDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const placementClass =
    menuPlacement === "top"
      ? "bottom-full mb-[6px] top-auto"
      : "";

  return (
    <div
      ref={rootRef}
      className={
        open
          ? "relative z-50 inline-flex items-center"
          : "relative inline-flex items-center"
      }
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
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={`${DROPDOWN_PANEL_ANCHORED_CLASS} right-0 left-auto min-w-40 overflow-hidden py-1 ${placementClass} ${dropdownPanelStateClass(true)}`}
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
              setOpen(false);
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
              setOpen(false);
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
