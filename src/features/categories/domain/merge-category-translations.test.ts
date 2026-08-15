import { describe, expect, it } from "vitest";

import {
  hasCategoryLocaleCopy,
  mergeCategoryTranslations,
} from "@/features/categories/domain/merge-category-translations";

describe("mergeCategoryTranslations", () => {
  it("writes filled locales without dropping existing ones", () => {
    const next = mergeCategoryTranslations(
      { hy: { title: "Խորոված", slug: "khorovats" } },
      {
        en: { title: "Khorovats", slug: "khorovats" },
        ru: { title: "Хоровац", slug: "horovats" },
      },
    );

    expect(next.hy).toEqual({ title: "Խորոված", slug: "khorovats" });
    expect(next.en).toEqual({ title: "Khorovats", slug: "khorovats" });
    expect(next.ru).toEqual({ title: "Хоровац", slug: "horovats" });
  });

  it("updates an existing locale in place", () => {
    const next = mergeCategoryTranslations(
      { en: { title: "Old", slug: "old" } },
      { en: { title: "Grill", slug: "grill" } },
    );

    expect(next.en).toEqual({ title: "Grill", slug: "grill" });
  });
});

describe("hasCategoryLocaleCopy", () => {
  it("is false when every locale is empty", () => {
    expect(hasCategoryLocaleCopy({})).toBe(false);
  });

  it("is true when any locale has a title", () => {
    expect(
      hasCategoryLocaleCopy({ ru: { title: "Гриль", slug: "gril" } }),
    ).toBe(true);
  });
});
