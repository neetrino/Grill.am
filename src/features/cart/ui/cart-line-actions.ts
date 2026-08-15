"use client";

import { setCartLineDesiredQuantity } from "@/features/cart/cart-line-coordinator";
import type { CartDrawerItemView } from "@/features/cart/get-cart-drawer-view";
import type { CartModifiers } from "@/features/products/domain/customization";

/** Shared drawer/sidebar mutations using per-line desired-state coordination. */
export function changeCartLineQuantity(
  item: CartDrawerItemView,
  quantity: number,
  modifiers?: CartModifiers,
): void {
  void setCartLineDesiredQuantity({
    productId: item.productId,
    selectionKey: item.selectionKey,
    quantity,
    modifiers,
  });
}

export function removeCartLine(item: CartDrawerItemView): void {
  changeCartLineQuantity(item, 0);
}
