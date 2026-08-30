import { defaultLocale, locales } from "../i18n/config";

export type WooLegacyRedirect = {
  source: string;
  destination: string;
  statusCode: 301;
};

const LOCALE_GROUP = locales.join("|");

/**
 * 301 map from WooCommerce / WPML URLs onto the current catalog.
 * Uses `statusCode: 301` — Next `permanent: true` emits 308, not 301.
 * Does not match `/products` — only the legacy `/product` and shop paths.
 */
export function getWooLegacyRedirects(): WooLegacyRedirect[] {
  return [
    {
      source: "/shop",
      destination: `/${defaultLocale}/products`,
      statusCode: 301,
    },
    {
      source: "/shop/:path*",
      destination: `/${defaultLocale}/products`,
      statusCode: 301,
    },
    {
      source: `/:locale(${LOCALE_GROUP})/shop`,
      destination: "/:locale/products",
      statusCode: 301,
    },
    {
      source: `/:locale(${LOCALE_GROUP})/shop/:path*`,
      destination: "/:locale/products",
      statusCode: 301,
    },
    {
      source: "/product/:slug",
      destination: `/${defaultLocale}/products/:slug`,
      statusCode: 301,
    },
    {
      source: `/:locale(${LOCALE_GROUP})/product/:slug`,
      destination: "/:locale/products/:slug",
      statusCode: 301,
    },
    {
      source: "/product-category/:slug",
      destination: `/${defaultLocale}/products?category=:slug`,
      statusCode: 301,
    },
    {
      source: "/product-category/:slug/:path*",
      destination: `/${defaultLocale}/products?category=:slug`,
      statusCode: 301,
    },
    {
      source: `/:locale(${LOCALE_GROUP})/product-category/:slug`,
      destination: "/:locale/products?category=:slug",
      statusCode: 301,
    },
    {
      source: `/:locale(${LOCALE_GROUP})/product-category/:slug/:path*`,
      destination: "/:locale/products?category=:slug",
      statusCode: 301,
    },
  ];
}
