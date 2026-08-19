import { describe, expect, it } from "vitest";

import {
  resolveStoreTranslation,
  slugifyStoreLabel,
  validateStoreLocaleCopy,
  validateStoreTranslations,
} from "@/features/stores/domain/store-rules";

describe("store rules", () => {
  it("accepts valid store copy", () => {
    expect(
      validateStoreLocaleCopy({
        title: "Pushkin",
        address: "Pushkin 43/3",
      }),
    ).toBeNull();
  });

  it("requires title and address", () => {
    expect(
      validateStoreLocaleCopy({ title: "", address: "Pushkin 43/3" }),
    ).toBe("TITLE_REQUIRED");
    expect(validateStoreLocaleCopy({ title: "Pushkin", address: "" })).toBe(
      "ADDRESS_REQUIRED",
    );
  });

  it("requires at least one locale", () => {
    expect(validateStoreTranslations({})).toBe("TITLE_REQUIRED");
  });

  it("resolves locale with fallbacks", () => {
    expect(
      resolveStoreTranslation(
        {
          en: { title: "EN", address: "EN addr" },
          hy: { title: "HY", address: "HY addr" },
        },
        "ru",
      ),
    ).toEqual({ title: "EN", address: "EN addr" });
  });

  it("slugifies store labels", () => {
    expect(slugifyStoreLabel("Pushkin 43/3")).toBe("pushkin-43-3");
    expect(slugifyStoreLabel("   ")).toBe("store");
  });
});
