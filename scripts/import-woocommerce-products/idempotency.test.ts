import { describe, expect, it } from "vitest";

import {
  buildCategoryPlans,
  findExistingCategory,
  type ExistingCategory,
} from "./conflicts";
import { stockCorrelationId } from "./sku-and-price";

describe("category upsert matching", () => {
  it("reuses categories by normalized Armenian title", () => {
    const existing: ExistingCategory[] = [
      {
        id: "cat-1",
        titleHy: "Կոմբո առաջարկներ, ակցիաներ",
        slugHy: "կոմբո-առաջարկներ-ակցիաներ",
        titleEn: null,
        slugEn: null,
      },
    ];

    const found = findExistingCategory(
      existing,
      "Կոմբո առաջարկներ, ակցիաներ",
    );
    expect(found?.id).toBe("cat-1");

    const plans = buildCategoryPlans(
      ["Կոմբո առաջարկներ, ակցիաներ", "Շաուրմա"],
      existing,
    );
    expect(plans[0]?.plannedMutation).toBe("reused");
    expect(plans[1]?.plannedMutation).toBe("created");
  });
});

describe("stock movement correlation", () => {
  it("uses stable correlation ids to avoid duplicate IMPORT rows", () => {
    expect(stockCorrelationId("WC-271")).toBe("wc-import:WC-271");
    expect(stockCorrelationId("WC-271")).toBe(stockCorrelationId("WC-271"));
  });
});
