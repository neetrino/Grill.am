import { describe, expect, it } from "vitest";

import {
  findComboCategory,
  isComboCategory,
} from "@/features/categories/domain/combo-category";

describe("combo category", () => {
  it("matches Armenian, English, and Russian combo names", () => {
    expect(
      isComboCategory({
        slug: "կոմբո-առաջարկներ-ակցիաներ",
        title: "Կոմբո առաջարկներ",
      }),
    ).toBe(true);
    expect(isComboCategory({ slug: "combos", title: "Combos" })).toBe(true);
    expect(isComboCategory({ slug: "kombo", title: "Комбо" })).toBe(true);
  });

  it("does not treat unrelated categories as combos", () => {
    expect(isComboCategory({ slug: "shawarma", title: "Շաուրմա" })).toBe(false);
    expect(isComboCategory({ slug: "akcia", title: "Ակցիաներ" })).toBe(false);
  });

  it("returns the first combo category from a list", () => {
    const found = findComboCategory([
      { slug: "salads", title: "Salads" },
      { slug: "combos", title: "Combos" },
    ]);
    expect(found?.slug).toBe("combos");
  });
});
