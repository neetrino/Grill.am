"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, MapPin } from "lucide-react";

type FooterAddressDropdownProps = {
  addresses: readonly string[];
  toggleLabel: string;
};

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

const CONTACT_ICON_CLASS = "mt-0.5 h-[15px] w-[15px] shrink-0 text-[#FF4A12]";
const MENU_TRANSITION_MS = 200;

export function FooterAddressDropdown({
  addresses,
  toggleLabel,
}: FooterAddressDropdownProps) {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const listId = useId();
  const rootRef = useRef<HTMLLIElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [primary, ...rest] = addresses;

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setRendered(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setRendered(false);
      closeTimerRef.current = null;
    }, MENU_TRANSITION_MS);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!rendered) {
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
        minWidth: Math.max(220, rect.width),
      });
    };

    updatePosition();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
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
  }, [rendered]);

  if (!primary) {
    return null;
  }

  const hasMore = rest.length > 0;

  const menu =
    rendered && hasMore && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            className={`fixed z-[200] max-h-[140px] origin-top space-y-2 overflow-y-auto rounded-[14px] border border-white/10 bg-black px-3 py-2.5 text-sm text-white/60 shadow-lg transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
              visible
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-1 opacity-0"
            }`}
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.minWidth,
            }}
          >
            {rest.map((address) => (
              <li key={address} className="leading-5 whitespace-nowrap">
                {address}
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <li ref={rootRef} className="relative z-20">
      <div ref={anchorRef} className="flex items-start gap-3">
        <MapPin className={CONTACT_ICON_CLASS} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className="leading-5">{primary}</span>
            {hasMore ? (
              <button
                ref={triggerRef}
                type="button"
                className="mt-0.5 shrink-0 text-[#9C9FA1] transition hover:text-white"
                aria-expanded={open}
                aria-controls={listId}
                aria-label={toggleLabel}
                onClick={() => setOpen((value) => !value)}
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                    open ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {menu}
    </li>
  );
}
