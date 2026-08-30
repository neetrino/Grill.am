import { describe, expect, it } from "vitest";

import { getWooLegacyRedirects } from "@/lib/seo/woo-legacy-redirects";

describe("getWooLegacyRedirects", () => {
  const redirects = getWooLegacyRedirects();

  it("emits HTTP 301, not Next permanent/308", () => {
    expect(redirects.length).toBeGreaterThan(0);
    expect(redirects.every((rule) => rule.statusCode === 301)).toBe(true);
    expect(redirects.every((rule) => !("permanent" in rule))).toBe(true);
  });

  it("maps unprefixed Woo product and shop URLs onto default-locale catalog", () => {
    expect(redirects).toContainEqual({
      source: "/product/:slug",
      destination: "/hy/products/:slug",
      statusCode: 301,
    });
    expect(redirects).toContainEqual({
      source: "/shop",
      destination: "/hy/products",
      statusCode: 301,
    });
    expect(redirects).toContainEqual({
      source: "/product-category/:slug",
      destination: "/hy/products?category=:slug",
      statusCode: 301,
    });
  });

  it("maps locale-prefixed Woo shop URLs without touching /products", () => {
    expect(redirects).toContainEqual({
      source: "/:locale(hy|en|ru)/shop",
      destination: "/:locale/products",
      statusCode: 301,
    });
    expect(
      redirects.some(
        (rule) =>
          rule.source === "/products" || rule.source.startsWith("/products/"),
      ),
    ).toBe(false);
  });
});
