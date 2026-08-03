"use client";

import { useEffect, useId, useRef, useState } from "react";

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
          className={
            menuPlacement === "top"
              ? "absolute right-0 bottom-full z-[100] mb-2 min-w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-2xl"
              : "absolute top-full right-0 z-[100] mt-2 min-w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-2xl"
          }
        >
          <div
            onClick={(event) => {
              // Closing unmounts menu children. Form submits (e.g. logout)
              // must finish first; the following redirect navigates away.
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
