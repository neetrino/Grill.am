import type { Locale } from "@/lib/i18n/config";

/** Crisp is for customer routes only — not the admin panel. */
export function isCrispEnabledPath(pathname: string, locale: Locale): boolean {
  const adminBase = `/${locale}/admin`;
  return pathname !== adminBase && !pathname.startsWith(`${adminBase}/`);
}
