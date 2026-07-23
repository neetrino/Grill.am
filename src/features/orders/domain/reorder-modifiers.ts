import type { OrderItemModifiersSnapshot } from "@/db/schema/orders";
import {
  EMPTY_CART_MODIFIERS,
  parseCartModifiers,
  type CartModifiers,
} from "@/features/products/domain/customization";

/**
 * Maps an order-line modifiers snapshot to cart modifiers (labels dropped).
 * Returns empty modifiers when the snapshot is missing or invalid.
 */
export function cartModifiersFromOrderSnapshot(
  snapshot: OrderItemModifiersSnapshot | null | undefined,
): CartModifiers {
  if (!snapshot) {
    return { ...EMPTY_CART_MODIFIERS };
  }

  return parseCartModifiers({
    optionChoices: snapshot.optionChoices,
    addonIds: snapshot.addonIds,
    exclusionIds: snapshot.exclusionIds,
  });
}
