import { describe, expect, it } from "vitest";

import {
  normalizeJobSlug,
  validateJobLocaleCopy,
  validateJobTranslations,
  withSharedJobSlug,
} from "@/features/careers/domain/job-rules";

describe("job-rules", () => {
  it("normalizes slugs", () => {
    expect(normalizeJobSlug("  Senior Grill Chef! ")).toBe("senior-grill-chef");
  });

  it("requires title, slug, and description", () => {
    expect(
      validateJobLocaleCopy({
        title: "",
        slug: "chef",
        description: "Cook food",
      }),
    ).toBe("TITLE_REQUIRED");

    expect(
      validateJobLocaleCopy({
        title: "Chef",
        slug: "",
        description: "Cook food",
      }),
    ).toBe("SLUG_REQUIRED");

    expect(
      validateJobLocaleCopy({
        title: "Chef",
        slug: "chef",
        description: "",
      }),
    ).toBe("DESCRIPTION_REQUIRED");
  });

  it("accepts a valid locale copy set", () => {
    expect(
      validateJobTranslations({
        en: {
          title: "Chef",
          slug: "chef",
          description: "Cook food",
          location: "Yerevan",
        },
      }),
    ).toBeNull();
  });

  it("applies one shared slug to every locale", () => {
    expect(
      withSharedJobSlug(
        {
          en: {
            title: "Chef",
            slug: "old-en",
            description: "Cook",
          },
          hy: {
            title: "Խոհարար",
            slug: "old-hy",
            description: "Պատրաստել",
          },
        },
        "Senior Grill Chef!",
      ),
    ).toEqual({
      en: {
        title: "Chef",
        slug: "senior-grill-chef",
        description: "Cook",
      },
      hy: {
        title: "Խոհարար",
        slug: "senior-grill-chef",
        description: "Պատրաստել",
      },
    });
  });
});
