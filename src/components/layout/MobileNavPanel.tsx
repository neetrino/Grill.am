"use client";

import { ChevronDown } from "lucide-react";
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
import type { StorefrontNavCategory } from "@/features/categories/storefront-nav-category";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

export type MobileNavPanelProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  navItems: readonly StorefrontNavItem[];
  categories: readonly StorefrontNavCategory[];
  categorySlug: string | null;
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
  dictionary,
  navItems,
  categories,
  categorySlug,
  isOpen,
  menuId,
  onClose,
}: MobileNavPanelProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Tracks the `isOpen` prop value last synced into `visible`/`expanded`.
  const [openSynced, setOpenSynced] = useState(isOpen);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const productsPath = `/${locale}/products`;

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
    <div className="md:hidden" aria-hidden={!expanded}>
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
              if (item.kind === "categories") {
                const sectionActive =
                  pathname === productsPath ||
                  pathname.startsWith(`${productsPath}/`);

                return (
                  <div key={item.id}>
                    <div className="flex w-full items-center gap-2">
                      <AppLink
                        href={productsPath}
                        prefetchPolicy="intent"
                        className={
                          sectionActive
                            ? "flex-1 rounded-xl px-1 py-3.5 text-left text-base font-semibold text-brand-red"
                            : "flex-1 rounded-xl px-1 py-3.5 text-left text-base font-semibold text-[#171717]"
                        }
                        onClick={onClose}
                      >
                        {item.label}
                      </AppLink>
                      <button
                        type="button"
                        className={
                          sectionActive || categoriesOpen
                            ? "rounded-xl p-2 text-brand-red"
                            : "rounded-xl p-2 text-[#171717]"
                        }
                        aria-expanded={categoriesOpen}
                        aria-label={item.label}
                        onClick={() => setCategoriesOpen((value) => !value)}
                      >
                        <ChevronDown
                          className={`size-4 transition ${
                            categoriesOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        />
                      </button>
                    </div>
                    {categoriesOpen ? (
                      <div className="pb-1">
                        <AppLink
                          href={productsPath}
                          prefetchPolicy="intent"
                          className={
                            pathname === productsPath && !categorySlug
                              ? "block rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-red"
                              : "block rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          }
                          onClick={onClose}
                        >
                          {dictionary.nav.allCategories}
                        </AppLink>
                        {categories.map((category) => {
                          const href = `${productsPath}?category=${encodeURIComponent(category.slug)}`;
                          const active = categorySlug === category.slug;
                          return (
                            <AppLink
                              key={category.id}
                              href={href}
                              prefetchPolicy="intent"
                              className={
                                active
                                  ? "block rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-red"
                                  : "block rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              }
                              onClick={onClose}
                            >
                              {category.title}
                            </AppLink>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              const active = isStorefrontNavActive(pathname, item, locale, {
                categorySlug,
              });

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
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 py-4">
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
            <div className="min-w-0 space-y-2">
              <span className="text-xs font-medium tracking-wide text-gray-500">
                {dictionary.header.currency}
              </span>
              <CurrencySwitcher
                currency={currency}
                label={dictionary.header.currency}
                variant="segmented"
              />
            </div>
          </div>
        </nav>
      </div>
    </div>,
    document.body,
  );
}
