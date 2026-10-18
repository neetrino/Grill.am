import { describe, expect, it } from "vitest";

import { resolveProductCardBonusEarnByProductId } from "@/features/loyalty/application/product-card-bonus";

describe("resolveProductCardBonusEarnByProductId", () => {
  it("returns an empty map without I/O when no products are given", async () => {
    const result = await resolveProductCardBonusEarnByProductId([]);

    expect(result.size).toBe(0);
  });
});
