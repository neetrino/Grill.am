/**
 * Remaining units available for one selection of a product, after other
 * selectionKey lines of the same product are counted.
 */
export function remainingStockForCartLine(
  stockOnHand: number,
  quantityOnOtherLines: number,
): number {
  const stock = Math.max(0, Math.trunc(stockOnHand));
  const others = Math.max(0, Math.trunc(quantityOnOtherLines));
  return Math.max(0, stock - others);
}

/** True when requested quantity fits remaining stock for this product. */
export function canSetCartLineQuantity(
  stockOnHand: number,
  quantityOnOtherLines: number,
  requestedQuantity: number,
): boolean {
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 0) {
    return false;
  }
  if (requestedQuantity === 0) {
    return true;
  }
  return (
    requestedQuantity <=
    remainingStockForCartLine(stockOnHand, quantityOnOtherLines)
  );
}

/** Throws when a positive quantity would exceed product stock. */
export function assertCartLineQuantityWithinStock(
  stockOnHand: number,
  quantityOnOtherLines: number,
  requestedQuantity: number,
): void {
  if (
    !canSetCartLineQuantity(
      stockOnHand,
      quantityOnOtherLines,
      requestedQuantity,
    )
  ) {
    throw new Error("Product unavailable.");
  }
}
