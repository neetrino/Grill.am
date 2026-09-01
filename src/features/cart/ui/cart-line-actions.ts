"use client";

import { setCartLineDesiredQuantity } from "@/features/cart/cart-line-coordinator";
import { notifyCartMinOrderBlocked } from "@/features/cart/cart-min-order-alert";
import type { CartDrawerItemView } from "@/features/cart/get-cart-drawer-view";
import type { CartModifiers } from "@/features/products/domain/customization";
import {
  minOrderQuantityForSlug,
  resolveCartLineQuantity,
} from "@/features/products/domain/min-order-quantity";

/** Shared drawer/sidebar mutations using per-line desired-state coordination. */
export function changeCartLineQuantity(
  item: CartDrawerItemView,
  quantity: number,
  modifiers?: CartModifiers,
): void {
  const minQty = minOrderQuantityForSlug(item.slug);
  const resolved = resolveCartLineQuantity(quantity, minQty);
  if (resolved.raisedToMin) {
    notifyCartMinOrderBlocked(minQty);
  }
  void setCartLineDesiredQuantity({
    productId: item.productId,
    selectionKey: item.selectionKey,
    quantity: resolved.quantity,
    modifiers,
  });
}

export function removeCartLine(item: CartDrawerItemView): void {
  changeCartLineQuantity(item, 0);
}
