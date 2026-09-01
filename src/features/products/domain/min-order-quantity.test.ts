import { describe, expect, it } from "vitest";

import {
  assertPositiveQuantityMeetsMinOrder,
  clampCartQuantityToMinOrder,
  minOrderQuantityForSlug,
  minOrderQuantityFromTranslations,
  resolveCartLineQuantity,
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

  it("raises below-min desired quantities to the minimum", () => {
    expect(resolveCartLineQuantity(1, 2)).toEqual({
      quantity: 2,
      raisedToMin: true,
    });
    expect(resolveCartLineQuantity(2, 2)).toEqual({
      quantity: 2,
      raisedToMin: false,
    });
    expect(resolveCartLineQuantity(0, 2)).toEqual({
      quantity: 0,
      raisedToMin: false,
    });
  });

  it("clampCartQuantityToMinOrder delegates to resolveCartLineQuantity", () => {
    expect(clampCartQuantityToMinOrder(1, 2)).toBe(2);
    expect(clampCartQuantityToMinOrder(2, 2)).toBe(2);
    expect(clampCartQuantityToMinOrder(0, 2)).toBe(0);
  });
});
