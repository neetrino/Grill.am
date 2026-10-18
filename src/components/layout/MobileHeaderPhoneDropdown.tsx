"use client";

import { Phone } from "lucide-react";

import { WhatsAppIcon } from "@/components/layout/SocialIcons";
import {
  DROPDOWN_OPTION_CLASS,
  DROPDOWN_OPTION_ROW_CLASS,
} from "@/components/ui/dropdown-styles";
import { IconDropdown } from "@/components/ui/IconDropdown";
import { buildPhoneMenuItems, telHref, whatsappHref } from "@/lib/phone";

type MobileHeaderPhoneDropdownProps = {
  phones: readonly string[];
  /** Numbers opened in WhatsApp instead of the dialer. */
  whatsappPhones?: readonly string[];
  label: string;
  triggerClassName?: string;
};

const OPTION_CLASS = `${DROPDOWN_OPTION_CLASS} ${DROPDOWN_OPTION_ROW_CLASS} font-medium hover:text-brand-red`;

/** Mobile header call button — WhatsApp numbers open WhatsApp, the rest dial. */
export function MobileHeaderPhoneDropdown({
  phones,
  whatsappPhones = [],
  label,
  triggerClassName,
}: MobileHeaderPhoneDropdownProps) {
  const menuItems = buildPhoneMenuItems(phones, whatsappPhones, {
    keepWhatsAppNumbersCallable: true,
  });

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <IconDropdown
      label={label}
      triggerClassName={triggerClassName}
      closeOnScroll
      trigger={
        <Phone
          className="size-4.5 min-[390px]:size-5"
          strokeWidth={1.75}
          aria-hidden
        />
      }
    >
      {menuItems.map((item) => {
        const isWhatsApp = item.channel === "whatsapp";

        return (
          <a
            key={`${item.channel}-${item.phone}`}
            href={isWhatsApp ? whatsappHref(item.phone) : telHref(item.phone)}
            target={isWhatsApp ? "_blank" : undefined}
            rel={isWhatsApp ? "noopener noreferrer" : undefined}
            role="menuitem"
            className={OPTION_CLASS}
          >
            {isWhatsApp ? (
              <WhatsAppIcon className="size-4 shrink-0 text-[#25D366]" />
            ) : (
              <Phone className="size-4 shrink-0 text-brand-red" aria-hidden />
            )}
            {item.phone}
          </a>
        );
      })}
    </IconDropdown>
  );
}
