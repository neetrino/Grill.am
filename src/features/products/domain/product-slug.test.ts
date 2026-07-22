import { describe, expect, it } from "vitest";

import {
  normalizeProductSlug,
  resolveSharedProductSlug,
  withSharedProductSlug,
} from "@/features/products/domain/product-slug";

describe("product shared slug", () => {
  it("normalizes slugs", () => {
    expect(normalizeProductSlug("  Smoked Brisket! ")).toBe("smoked-brisket");
  });

  it("applies one shared slug to every locale", () => {
    const next = withSharedProductSlug(
      {
        en: {
          title: "Brisket",
          slug: "old-en",
        },
        hy: {
          title: "Բրիսկետ",
          slug: "old-hy",
        },
      },
      "Smoked Brisket",
    );

    expect(next.en?.slug).toBe("smoked-brisket");
    expect(next.hy?.slug).toBe("smoked-brisket");
    expect(resolveSharedProductSlug(next)).toBe("smoked-brisket");
  });
});
