import { describe, expect, it } from "vitest";

import {
  assertPositiveQuantityMeetsMinOrder,
  clampCartQuantityToMinOrder,
  minOrderQuantityForSlug,
  minOrderQuantityFromTranslations,
} from "@/features/products/domain/min-order-quantity";

describe("min-order-quantity", () => {
  it("returns 2 for havi-gril-mijin and 1 otherwise", () => {
    expect(minOrderQuantityForSlug("havi-gril-mijin")).toBe(2);
    expect(minOrderQuantityForSlug("HAVI-GRIL-MIJIN")).toBe(2);
    expect(minOrderQuantityForSlug("other-product")).toBe(1);
  });

  it("reads min from any locale slug on translations", () => {
    expect(
      minOrderQuantityFromTranslations({
        en: { title: "Chicken", slug: "havi-gril-mijin" },
      }),
    ).toBe(2);
    expect(
      minOrderQuantityFromTranslations({
        hy: { title: "Սովորական", slug: "plain" },
      }),
    ).toBe(1);
  });

  it("rejects positive quantities below the minimum", () => {
    expect(() => assertPositiveQuantityMeetsMinOrder(1, 2)).toThrow(
      "Below minimum order quantity.",
    );
    expect(() => assertPositiveQuantityMeetsMinOrder(2, 2)).not.toThrow();
    expect(() => assertPositiveQuantityMeetsMinOrder(0, 2)).not.toThrow();
  });

  it("clamps below-min desired quantities to 0 (remove)", () => {
    expect(clampCartQuantityToMinOrder(1, 2)).toBe(0);
    expect(clampCartQuantityToMinOrder(2, 2)).toBe(2);
    expect(clampCartQuantityToMinOrder(0, 2)).toBe(0);
  });
});
