import { describe, expect, it } from "vitest";

import {
  buildCategoryLocaleCopies,
  draftsFromCategoryTranslations,
  resolveCategoryEditorLocale,
} from "@/features/categories/ui/category-drawer-drafts";

describe("buildCategoryLocaleCopies", () => {
  it("keeps only locales with a title and slugs from the title", () => {
    const copies = buildCategoryLocaleCopies({
      hy: { title: "Խորոված", slug: "", slugTouched: false },
      en: { title: "Khorovats", slug: "bbq", slugTouched: true },
      ru: { title: "  ", slug: "", slugTouched: false },
    });

    expect(copies.hy?.title).toBe("Խորոված");
    expect(copies.en).toEqual({ title: "Khorovats", slug: "bbq" });
    expect(copies.ru).toBeUndefined();
  });
});

describe("resolveCategoryEditorLocale", () => {
  it("prefers the page locale when that translation exists", () => {
    expect(
      resolveCategoryEditorLocale("ru", {
        en: { title: "Grill", slug: "grill" },
        ru: { title: "Гриль", slug: "gril" },
      }),
    ).toBe("ru");
  });

  it("falls back to the first filled locale", () => {
    expect(
      resolveCategoryEditorLocale("hy", {
        en: { title: "Grill", slug: "grill" },
      }),
    ).toBe("en");
  });
});

describe("draftsFromCategoryTranslations", () => {
  it("seeds empty drafts for missing locales", () => {
    const drafts = draftsFromCategoryTranslations({
      hy: { title: "Խորոված", slug: "khorovats" },
    });

    expect(drafts.hy.title).toBe("Խորոված");
    expect(drafts.en.title).toBe("");
    expect(drafts.ru.title).toBe("");
  });
});
