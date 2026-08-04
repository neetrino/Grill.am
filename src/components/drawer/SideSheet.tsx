"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { DrawerCloseTab } from "@/components/drawer/DrawerCloseTab";

const PANEL_TRANSITION_MS = 300;
const BACKDROP_TRANSITION_MS = 200;
const DEFAULT_DESKTOP_WIDTH_PERCENT = 36;

type SideSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  closeLabel: string;
  headerActions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Desktop panel width as viewport percent. Mobile uses cart-drawer sizing. */
  desktopWidthPercent?: number;
  /**
   * Max-width utility below `lg` (default `max-w-sm`).
   * Use a wider class when the sheet hosts multi-column tables.
   */
  mobileMaxWidthClassName?: string;
  /** Extra classes for the white/colored panel shell. */
  panelClassName?: string;
  /** Extra classes for the sticky header. */
  headerClassName?: string;
  /** Extra classes for the scrollable body. */
  bodyClassName?: string;
};

function subscribeNoop(): () => void {
  return () => undefined;
}

/**
 * Cart-style right side sheet (MaMarie profile pattern):
 * portal, slide-in panel, peek close tab, blurred backdrop.
 */
export function SideSheet({
  open,
  onClose,
  title,
  subtitle,
  closeLabel,
  headerActions,
  footer,
  children,
  desktopWidthPercent = DEFAULT_DESKTOP_WIDTH_PERCENT,
  mobileMaxWidthClassName = "max-w-sm",
  panelClassName = "",
  headerClassName = "",
  bodyClassName = "",
}: SideSheetProps) {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);
  const [openSnapshot, setOpenSnapshot] = useState(open);

  if (open !== openSnapshot) {
    setOpenSnapshot(open);
    if (open) {
      setRendered(true);
      setVisible(false);
    } else {
      setVisible(false);
    }
  }

  useEffect(() => {
    if (open && rendered) {
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => {
        cancelAnimationFrame(frameId);
      };
    }

    if (!open && rendered) {
      const timeoutId = window.setTimeout(() => {
        setRendered(false);
      }, PANEL_TRANSITION_MS);
      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    return undefined;
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [rendered, onClose]);

  if (!mounted || !rendered) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex justify-end overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="side-sheet-title"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        className={`absolute inset-0 rounded-none bg-black/40 backdrop-blur-sm transition-opacity ease-out motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${BACKDROP_TRANSITION_MS}ms` }}
        onClick={onClose}
      />

      <div
        className={`relative h-dvh max-h-dvh w-[87%] transition-transform ease-out motion-reduce:transition-none motion-reduce:duration-0 lg:w-[var(--side-sheet-desktop-width)] lg:max-w-none ${mobileMaxWidthClassName} ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          ["--side-sheet-desktop-width" as string]: `${desktopWidthPercent}%`,
          transitionDuration: `${PANEL_TRANSITION_MS}ms`,
        }}
      >
        <DrawerCloseTab onClose={onClose} closeLabel={closeLabel} />
        <aside
          className={`relative z-[2] flex h-full w-full flex-col overflow-hidden rounded-tl-3xl rounded-bl-3xl bg-white shadow-2xl ${panelClassName}`}
          onClick={(event) => event.stopPropagation()}
        >
          <header
            className={`shrink-0 border-b border-gray-100 px-6 py-4 lg:px-5 ${headerClassName}`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <h2
                  id="side-sheet-title"
                  className="text-xl leading-tight font-bold text-gray-900 lg:text-lg"
                >
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                ) : null}
              </div>
              {headerActions ? (
                <div className="shrink-0 lg:self-start">{headerActions}</div>
              ) : null}
            </div>
          </header>

          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 lg:px-4 ${bodyClassName}`}
          >
            <div
              className={
                footer
                  ? undefined
                  : "max-lg:pb-[calc(28px+env(safe-area-inset-bottom,0px))]"
              }
            >
              {children}
            </div>
          </div>

          {footer ? <div className="shrink-0">{footer}</div> : null}
        </aside>
      </div>
    </div>,
    document.body,
  );
}
