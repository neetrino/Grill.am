import { isLocale } from "@/lib/i18n/config";

/** Login/register routes that use the full-page auth backdrop. */
export function isAuthSurfacePath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0] ?? "";
  if (!isLocale(locale)) {
    return false;
  }
  const page = parts[1];
  return page === "login" || page === "register";
}
