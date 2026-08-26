import { isLocale } from "@/lib/i18n/config";

/** Storefront products catalog (“Մենյու” / Menu) and product detail routes. */
export function isStorefrontMenuPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0] ?? "";
  if (!isLocale(locale)) {
    return false;
  }
  return parts[1] === "products";
}
