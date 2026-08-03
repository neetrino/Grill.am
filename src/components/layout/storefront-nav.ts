import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export type StorefrontNavItem = {
  id: string;
  href: string;
  label: string;
  /** Opens category dropdown instead of navigating. */
  kind?: "link" | "categories";
};

/**
 * Primary storefront links — one destination per item.
 */
export function getStorefrontNavItems(
  locale: Locale,
  dictionary: Dictionary,
): readonly StorefrontNavItem[] {
  return [
    { id: "home", href: `/${locale}`, label: dictionary.nav.home },
    {
      id: "menu",
      href: `/${locale}/products`,
      label: dictionary.nav.products,
      kind: "categories",
    },
    {
      id: "shop",
      href: `/${locale}/products`,
      label: dictionary.nav.shop,
    },
    { id: "about", href: `/${locale}/about`, label: dictionary.nav.about },
    {
      id: "careers",
      href: `/${locale}/careers`,
      label: dictionary.nav.careers,
    },
    {
      id: "contact",
      href: `/${locale}/contact`,
      label: dictionary.nav.contact,
    },
  ] as const;
}

export function isStorefrontNavActive(
  pathname: string,
  item: StorefrontNavItem,
  locale: Locale,
  options?: { categorySlug?: string | null },
): boolean {
  const homeHref = `/${locale}`;
  const productsPath = `/${locale}/products`;

  if (item.id === "home") {
    return pathname === homeHref || pathname === `${homeHref}/`;
  }

  if (item.id === "menu") {
    return pathname === productsPath && Boolean(options?.categorySlug);
  }

  if (item.id === "shop") {
    if (pathname.startsWith(`${productsPath}/`)) {
      return true;
    }
    if (pathname === productsPath) {
      return !options?.categorySlug;
    }
    return false;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
