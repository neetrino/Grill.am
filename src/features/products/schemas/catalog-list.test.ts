import { describe, expect, it } from "vitest";

import {
  buildCatalogQuery,
  hasActiveCatalogFilters,
  parseCatalogSearchParams,
} from "@/features/products/schemas/catalog-list";

describe("parseCatalogSearchParams", () => {
  it("applies defaults for empty params", () => {
    expect(parseCatalogSearchParams({})).toEqual({
      category: [],
      sort: "newest",
      page: 1,
      pageSize: 24,
    });
  });

  it("parses multi category, sort, and price range", () => {
    expect(
      parseCatalogSearchParams({
        category: ["grills", "accessories"],
        sort: "price_asc",
        minPrice: "1000",
        maxPrice: "5000",
        inStock: "true",
        q: "  gas  grill  ",
        page: "2",
        pageSize: "12",
      }),
    ).toEqual({
      q: "gas grill",
      minPrice: 1000,
      maxPrice: 5000,
      category: ["grills", "accessories"],
      inStock: true,
      sort: "price_asc",
      page: 2,
      pageSize: 12,
    });
  });

  it("falls back when maxPrice < minPrice", () => {
    expect(
      parseCatalogSearchParams({
        minPrice: "5000",
        maxPrice: "1000",
      }),
    ).toEqual({
      category: [],
      sort: "newest",
      page: 1,
      pageSize: 24,
    });
  });
});

describe("buildCatalogQuery", () => {
  it("omits default values", () => {
    expect(
      buildCatalogQuery({
        category: [],
        sort: "newest",
        page: 1,
        pageSize: 24,
      }),
    ).toBe("");
  });

  it("serializes active filters", () => {
    const query = buildCatalogQuery({
      q: "grill",
      minPrice: 100,
      category: ["grills"],
      inStock: true,
      sort: "popular",
      page: 3,
      pageSize: 12,
    });

    expect(query).toContain("q=grill");
    expect(query).toContain("minPrice=100");
    expect(query).toContain("category=grills");
    expect(query).toContain("inStock=true");
    expect(query).toContain("sort=popular");
    expect(query).toContain("page=3");
    expect(query).toContain("pageSize=12");
  });
});

describe("hasActiveCatalogFilters", () => {
  it("ignores pagination-only state", () => {
    expect(
      hasActiveCatalogFilters({
        category: [],
        sort: "price_desc",
        page: 2,
        pageSize: 12,
      }),
    ).toBe(false);
  });

  it("detects filter state", () => {
    expect(
      hasActiveCatalogFilters({
        category: ["grills"],
        sort: "newest",
        page: 1,
        pageSize: 24,
      }),
    ).toBe(true);
  });
});
