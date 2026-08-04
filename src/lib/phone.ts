/** Digits-only phone value for tel: targets. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function telHref(phone: string): string {
  return `tel:${phoneDigits(phone)}`;
}
