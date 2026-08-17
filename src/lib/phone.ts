/** Digits-only phone value for tel: targets. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function telHref(phone: string): string {
  return `tel:${phoneDigits(phone)}`;
}

/** WhatsApp deep link for a display phone number. */
export function whatsappHref(phone: string): string {
  return `https://wa.me/${phoneDigits(phone)}`;
}
