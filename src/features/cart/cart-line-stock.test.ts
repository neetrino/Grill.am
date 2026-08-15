import { describe, expect, it } from "vitest";

import {
  assertCartLineQuantityWithinStock,
  canSetCartLineQuantity,
  remainingStockForCartLine,
} from "@/features/cart/cart-line-stock";

describe("cart-line-stock", () => {
  it("rejects quantity above remaining stock", () => {
    expect(canSetCartLineQuantity(5, 0, 6)).toBe(false);
    expect(() => assertCartLineQuantityWithinStock(5, 0, 6)).toThrow(
      "Product unavailable.",
    );
  });

  it("counts other selectionKey lines against the same product stock", () => {
    expect(remainingStockForCartLine(5, 2)).toBe(3);
    expect(canSetCartLineQuantity(5, 2, 3)).toBe(true);
    expect(canSetCartLineQuantity(5, 2, 4)).toBe(false);
  });

  it("allows deleting a line regardless of stock", () => {
    expect(canSetCartLineQuantity(0, 0, 0)).toBe(true);
  });
});
