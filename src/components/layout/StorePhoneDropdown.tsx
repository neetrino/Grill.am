"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChevronDown, Phone } from "lucide-react";

import { WhatsAppIcon } from "@/components/layout/SocialIcons";
import {
  DROPDOWN_ANIMATION_MS,
  DROPDOWN_PANEL_PORTAL_CLASS,
  DROPDOWN_OPTION_CLASS,
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
import { phoneDigits, telHref, whatsappHref } from "@/lib/phone";

type StorePhoneDropdownProps = {
  phones: readonly string[];
  /** Numbers shown in the dropdown with a WhatsApp icon / wa.me link. */
  whatsappPhones?: readonly string[];
  toggleLabel: string;
  variant?: "footer" | "header" | "topbar";
};

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
  maxWidth: number;
};

type PhoneMenuItem = {
  phone: string;
  channel: "phone" | "whatsapp";
};

const VIEWPORT_PADDING = 16;
const SCROLLBAR_HIDDEN_CLASS =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const FOOTER_STYLES = {
  root: "relative z-20",
  row: "flex items-start gap-3",
  icon: "mt-0.5 h-[15px] w-[15px] shrink-0 text-brand-yellow",
  link: "leading-5 text-white/60 transition hover:text-white",
  chevron: "mt-0.5 shrink-0 text-[#9C9FA1] transition hover:text-white",
  chevronIcon: "h-[18px] w-[18px]",
  menu: `fixed z-[400] max-h-[140px] origin-top space-y-1 overflow-y-auto rounded-[14px] border border-white/10 bg-black px-2 py-2 text-sm text-white/60 shadow-lg transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${SCROLLBAR_HIDDEN_CLASS}`,
  item: "flex items-center gap-2 rounded-lg px-2.5 py-1.5 leading-5 break-words transition hover:bg-white/10 hover:text-white",
  menuIcon: "size-4 shrink-0 text-brand-yellow",
} as const;

const LIGHT_VARIANT_STYLES = {
  header: {
    root: "relative z-20",
    row: "inline-flex items-center gap-2",
    icon: "h-[19px] w-[19px] shrink-0 text-[#333]",
    link: "text-base font-medium text-[#333] transition hover:text-brand-red",
    chevron: "shrink-0 text-[#333] transition hover:text-brand-red",
    chevronIcon: "h-5 w-5",
    menuLink: `${DROPDOWN_OPTION_CLASS} !flex items-center gap-2 hover:text-brand-red`,
    menuIcon: "size-4 shrink-0 text-[#333]",
    whatsappIcon: "size-4 shrink-0 text-[#25D366]",
  },
  topbar: {
    root: "relative z-20",
    row: "inline-flex items-center gap-2 text-gray-700",
    icon: "h-4 w-4 shrink-0",
    link: "font-medium transition-colors hover:text-brand-red",
    chevron: "shrink-0 text-gray-500 transition hover:text-brand-red",
    chevronIcon: "h-5 w-5",
    menuLink: `${DROPDOWN_OPTION_CLASS} !flex items-center gap-2 hover:text-brand-red`,
    menuIcon: "size-4 shrink-0",
    whatsappIcon: "size-4 shrink-0 text-[#25D366]",
  },
} as const;

/** Builds dropdown rows: WhatsApp numbers first, then remaining call-only phones. */
function buildPhoneMenuItems(
  phones: readonly string[],
  whatsappPhones: readonly string[],
): PhoneMenuItem[] {
  const [, ...rest] = phones;
  const seen = new Set<string>();
  const items: PhoneMenuItem[] = [];

  for (const phone of whatsappPhones) {
    const key = phoneDigits(phone);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push({ phone, channel: "whatsapp" });
  }

  for (const phone of rest) {
    const key = phoneDigits(phone);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push({ phone, channel: "phone" });
  }

  return items;
}

export function StorePhoneDropdown({
  phones,
  whatsappPhones = [],
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
  const [primary] = phones;
  const menuItems = useMemo(
    () => buildPhoneMenuItems(phones, whatsappPhones),
    [phones, whatsappPhones],
  );
  const isFooter = variant === "footer";
  const lightStyles = isFooter ? null : LIGHT_VARIANT_STYLES[variant];
  const showChevron = menuItems.length > 0;
  const animationMs = isFooter ? 200 : DROPDOWN_ANIMATION_MS;

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
    }, animationMs);
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

      if (isFooter) {
        const maxWidth = Math.min(360, window.innerWidth - VIEWPORT_PADDING * 2);
        const minWidth = Math.min(Math.max(220, rect.width), maxWidth);
        const left = Math.max(
          VIEWPORT_PADDING,
          Math.min(rect.left, window.innerWidth - minWidth - VIEWPORT_PADDING),
        );

        setMenuPosition({
          top: rect.bottom + 8,
          left,
          minWidth,
          maxWidth,
        });
        return;
      }

      const maxWidth = Math.min(280, window.innerWidth - VIEWPORT_PADDING * 2);
      const minWidth = Math.min(Math.max(180, rect.width), maxWidth);
      const preferredLeft = rect.right - minWidth;
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
      }, animationMs);
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
  }, [mounted, isFooter, animationMs]);

  if (!primary) {
    return null;
  }

  const visibilityClass = visible
    ? "translate-y-0 opacity-100"
    : "pointer-events-none -translate-y-1 opacity-0";

  const menu =
    mounted && showChevron && menuPosition
      ? createPortal(
          isFooter ? (
            <ul
              ref={menuRef}
              id={listId}
              className={`${FOOTER_STYLES.menu} ${visibilityClass}`}
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                minWidth: menuPosition.minWidth,
                maxWidth: menuPosition.maxWidth,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {menuItems.map((item) => (
                <li key={`${item.channel}-${item.phone}`}>
                  <a
                    href={
                      item.channel === "whatsapp"
                        ? whatsappHref(item.phone)
                        : telHref(item.phone)
                    }
                    className={FOOTER_STYLES.item}
                    target={item.channel === "whatsapp" ? "_blank" : undefined}
                    rel={
                      item.channel === "whatsapp"
                        ? "noopener noreferrer"
                        : undefined
                    }
                    onClick={closeMenu}
                  >
                    {item.channel === "whatsapp" ? (
                      <WhatsAppIcon className={FOOTER_STYLES.menuIcon} />
                    ) : (
                      <Phone className={FOOTER_STYLES.menuIcon} aria-hidden />
                    )}
                    {item.phone}
                  </a>
                </li>
              ))}
            </ul>
          ) : lightStyles ? (
            <ul
              ref={menuRef}
              id={listId}
              className={`${DROPDOWN_PANEL_PORTAL_CLASS} ${dropdownPanelStateClass(visible)}`}
              style={dropdownPortalStyle(menuPosition)}
            >
              {menuItems.map((item) => (
                <li key={`${item.channel}-${item.phone}`}>
                  <a
                    href={
                      item.channel === "whatsapp"
                        ? whatsappHref(item.phone)
                        : telHref(item.phone)
                    }
                    className={lightStyles.menuLink}
                    target={item.channel === "whatsapp" ? "_blank" : undefined}
                    rel={
                      item.channel === "whatsapp"
                        ? "noopener noreferrer"
                        : undefined
                    }
                    onClick={closeMenu}
                  >
                    {item.channel === "whatsapp" ? (
                      <WhatsAppIcon className={lightStyles.whatsappIcon} />
                    ) : (
                      <Phone className={lightStyles.menuIcon} aria-hidden />
                    )}
                    {item.phone}
                  </a>
                </li>
              ))}
            </ul>
          ) : null,
          document.body,
        )
      : null;

  const triggerStyles = isFooter ? FOOTER_STYLES : lightStyles;
  if (!triggerStyles) {
    return null;
  }

  return (
    <div ref={rootRef} className={triggerStyles.root}>
      <div ref={anchorRef} className={triggerStyles.row}>
        <Phone className={triggerStyles.icon} aria-hidden />
        <div className="flex min-w-0 items-center gap-2">
          <a href={telHref(primary)} className={triggerStyles.link}>
            {primary}
          </a>
          {showChevron ? (
            <button
              ref={triggerRef}
              type="button"
              className={triggerStyles.chevron}
              aria-expanded={visible}
              aria-controls={listId}
              aria-label={toggleLabel}
              onClick={toggleMenu}
            >
              <ChevronDown
                className={`${triggerStyles.chevronIcon} transition-transform duration-200 ease-out motion-reduce:transition-none ${
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
