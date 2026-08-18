import type { Locale } from "@/lib/i18n/config";

/** Tidio is for customer routes only — not the admin panel. */
export function isTidioEnabledPath(pathname: string, locale: Locale): boolean {
  const adminBase = `/${locale}/admin`;
  return pathname !== adminBase && !pathname.startsWith(`${adminBase}/`);
}
