import { describe, expect, it } from "vitest";

import { upsertJobPostingSchema } from "@/features/careers/schemas/job";

const base = {
  title: "Grill Chef",
  slug: "grill-chef",
  description: "Prepare grilled dishes.",
  editingLocale: "hy" as const,
  status: "DRAFT" as const,
  employmentType: "FULL_TIME" as const,
  salaryCurrency: "AMD" as const,
  sortOrder: "0",
  publishedAt: null,
};

describe("upsertJobPostingSchema", () => {
  it("accepts create payload without salaryAmount key (Zod 4)", () => {
    const parsed = upsertJobPostingSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.salaryAmount).toBeNull();
    }
  });

  it("accepts null and empty salaryAmount", () => {
    expect(
      upsertJobPostingSchema.safeParse({ ...base, salaryAmount: null }).success,
    ).toBe(true);
    expect(
      upsertJobPostingSchema.safeParse({ ...base, salaryAmount: "" }).success,
    ).toBe(true);
  });

  it("coerces integer salary strings", () => {
    const parsed = upsertJobPostingSchema.safeParse({
      ...base,
      salaryAmount: "250000",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.salaryAmount).toBe(250_000);
    }
  });

  it("rejects non-integer salary", () => {
    const parsed = upsertJobPostingSchema.safeParse({
      ...base,
      salaryAmount: "10.5",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty slug", () => {
    const parsed = upsertJobPostingSchema.safeParse({
      ...base,
      slug: "",
    });
    expect(parsed.success).toBe(false);
  });
});
