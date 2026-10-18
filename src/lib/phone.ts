/** Digits-only phone value for uniqueness keys and WhatsApp targets. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** International `tel:` URI with a leading `+`. */
export function telHref(phone: string): string {
  const digits = phoneDigits(phone);
  return digits ? `tel:+${digits}` : "tel:";
}

/** WhatsApp deep link for a display phone number. */
export function whatsappHref(phone: string): string {
  return `https://wa.me/${phoneDigits(phone)}`;
}

export type PhoneMenuItem = {
  phone: string;
  channel: "phone" | "whatsapp";
};

type BuildPhoneMenuItemsOptions = {
  /** Also list WhatsApp numbers as a call row (mobile header menu). */
  keepWhatsAppNumbersCallable?: boolean;
};

/** Drops blanks and repeats while keeping the original order. */
function uniquePhones(phones: readonly string[]): string[] {
  const seen = new Set<string>();

  return phones.filter((phone) => {
    const key = phoneDigits(phone);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Dropdown rows for a list of store numbers: WhatsApp numbers first, then the
 * call-only ones. A number present in both lists stays WhatsApp, unless
 * `keepWhatsAppNumbersCallable` also keeps its call row.
 */
export function buildPhoneMenuItems(
  phones: readonly string[],
  whatsappPhones: readonly string[],
  { keepWhatsAppNumbersCallable = false }: BuildPhoneMenuItemsOptions = {},
): PhoneMenuItem[] {
  const whatsappItems = uniquePhones(whatsappPhones).map<PhoneMenuItem>(
    (phone) => ({ phone, channel: "whatsapp" }),
  );
  const whatsappKeys = keepWhatsAppNumbersCallable
    ? new Set<string>()
    : new Set(whatsappItems.map((item) => phoneDigits(item.phone)));
  const callItems = uniquePhones(phones)
    .filter((phone) => !whatsappKeys.has(phoneDigits(phone)))
    .map<PhoneMenuItem>((phone) => ({ phone, channel: "phone" }));

  return [...whatsappItems, ...callItems];
}
