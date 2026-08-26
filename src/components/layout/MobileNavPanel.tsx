"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { CurrencySwitcher } from "@/components/layout/CurrencySwitcher";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import {
  isStorefrontNavActive,
  type StorefrontNavItem,
} from "@/components/layout/storefront-nav";
import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

export type MobileNavPanelProps = {
  locale: Locale;
  currency: Currency;
  availableCurrencies: readonly Currency[];
  dictionary: Dictionary;
  navItems: readonly StorefrontNavItem[];
  isOpen: boolean;
  menuId: string;
  onClose: () => void;
};

const MENU_EXIT_MS = 340;
const MENU_GAP_PX = 8;
const MENU_INSET_PX = 12;

function subscribeNoop(): () => void {
  return () => undefined;
}

function applyPanelOffset(panel: HTMLDivElement): void {
  const header = document.querySelector("[data-site-header]");
  const headerBottom =
    header instanceof HTMLElement
      ? Math.round(header.getBoundingClientRect().bottom)
      : 90;
  const top = headerBottom + MENU_GAP_PX;
  panel.style.top = `${top}px`;
  panel.style.maxHeight = `calc(100dvh - ${top}px - ${MENU_INSET_PX}px)`;
}

/**
 * MaMarie-style mobile burger menu — dropdown panel under the header (not a side drawer).
 */
export function MobileNavPanel({
  locale,
  currency,
  availableCurrencies,
  dictionary,
  navItems,
  isOpen,
  menuId,
  onClose,
}: MobileNavPanelProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Tracks the `isOpen` prop value last synced into `visible`/`expanded`.
  const [openSynced, setOpenSynced] = useState(isOpen);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // Adjust state during render when `isOpen` flips true (React "adjusting
  // state on prop change" pattern) instead of a synchronous setState inside
  // an effect.
  if (isOpen !== openSynced) {
    setOpenSynced(isOpen);
    if (isOpen) {
      setVisible(true);
      setExpanded(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      clearCloseTimer();
      if (!visible) {
        return;
      }
      const openFrame = requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (panel) {
          applyPanelOffset(panel);
        }
        // Second frame so the closed styles paint before the open transition.
        requestAnimationFrame(() => {
          setExpanded(true);
        });
      });
      return () => cancelAnimationFrame(openFrame);
    }

    if (!visible) {
      return;
    }

    clearCloseTimer();
    const closeFrame = requestAnimationFrame(() => {
      setExpanded(false);
    });
    closeTimerRef.current = setTimeout(() => {
      setVisible(false);
      closeTimerRef.current = null;
    }, MENU_EXIT_MS);

    return () => {
      cancelAnimationFrame(closeFrame);
      clearCloseTimer();
    };
  }, [clearCloseTimer, isOpen, visible]);

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    function onViewportChange(): void {
      const node = panelRef.current;
      if (node) {
        applyPanelOffset(node);
      }
    }

    onViewportChange();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, { passive: true });
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, visible]);

  if (!mounted || !visible) {
    return null;
  }

  return createPortal(
    <div className="lg:hidden" aria-hidden={!expanded}>
      <button
        type="button"
        aria-label={dictionary.nav.closeMenu}
        className="fixed inset-0 z-[40] border-0 bg-black/25 backdrop-blur-[8px] transition-[opacity,visibility] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: expanded ? 1 : 0,
          visibility: expanded ? "visible" : "hidden",
          pointerEvents: expanded ? "auto" : "none",
        }}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label={dictionary.nav.navigation}
        className="fixed right-3 left-3 z-[45] origin-top overflow-hidden rounded-[24px] bg-white px-5 shadow-[0_12px_40px_rgba(0,0,0,0.16)] transition-[opacity,transform] duration-[340ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          opacity: expanded ? 1 : 0,
          transform: expanded
            ? "translateY(0) scale(1)"
            : "translateY(-14px) scale(0.96)",
        }}
      >
        <nav
          aria-label={dictionary.nav.navigation}
          className="flex max-h-[inherit] flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex flex-col py-3">
            {navItems
              .filter((item) => item.id !== "home")
              .map((item) => {
                const active = isStorefrontNavActive(pathname, item, locale);

                return (
                  <AppLink
                    key={item.id}
                    href={item.href}
                    prefetchPolicy="intent"
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "rounded-xl px-1 py-3.5 text-base font-semibold text-brand-red"
                        : "rounded-xl px-1 py-3.5 text-base font-semibold text-[#171717] hover:bg-gray-50"
                    }
                    onClick={(event) => {
                      onClose();
                      if (!active) {
                        return;
                      }
                      event.preventDefault();
                      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                    }}
                  >
                    {item.label}
                  </AppLink>
                );
              })}

            <AppLink
              href={`/${locale}/legal`}
              prefetchPolicy="intent"
              aria-current={
                pathname === `/${locale}/legal` ||
                pathname.startsWith(`/${locale}/legal/`)
                  ? "page"
                  : undefined
              }
              className={
                pathname === `/${locale}/legal` ||
                pathname.startsWith(`/${locale}/legal/`)
                  ? "rounded-xl px-1 py-3.5 text-base font-semibold text-brand-red"
                  : "rounded-xl px-1 py-3.5 text-base font-semibold text-[#171717] hover:bg-gray-50"
              }
              onClick={onClose}
            >
              {dictionary.nav.policy}
            </AppLink>
          </div>

          <div
            className={`grid gap-3 border-t border-gray-100 py-4 ${
              availableCurrencies.length > 1 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <div className="min-w-0 space-y-2">
              <span className="text-xs font-medium tracking-wide text-gray-500">
                {dictionary.header.language}
              </span>
              <LocaleSwitcher
                locale={locale}
                label={dictionary.header.language}
                variant="segmented"
              />
            </div>
            {availableCurrencies.length > 1 ? (
              <div className="min-w-0 space-y-2">
                <span className="text-xs font-medium tracking-wide text-gray-500">
                  {dictionary.header.currency}
                </span>
                <CurrencySwitcher
                  currency={currency}
                  availableCurrencies={availableCurrencies}
                  label={dictionary.header.currency}
                  variant="segmented"
                />
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </div>,
    document.body,
  );
}
