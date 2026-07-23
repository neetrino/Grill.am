import { describe, expect, it } from "vitest";

import { normalizeHeaderSearchQuery } from "@/features/products/domain/header-search-query";

describe("normalizeHeaderSearchQuery", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeHeaderSearchQuery("  gas   grill  ")).toBe("gas grill");
  });

  it("caps length at 100 characters", () => {
    const long = "a".repeat(120);
    expect(normalizeHeaderSearchQuery(long)).toHaveLength(100);
  });
});
