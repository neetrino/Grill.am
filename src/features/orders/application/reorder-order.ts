"use server";

import { redirect } from "next/navigation";

import { addToCart } from "@/features/cart/cart";
import { getAdminOrderByNumber } from "@/features/orders/application/queries";
import { cartModifiersFromOrderSnapshot } from "@/features/orders/domain/reorder-modifiers";
import {
  EMPTY_CART_MODIFIERS,
  isEmptyModifiers,
  type CartModifiers,
} from "@/features/products/domain/customization";
import { requireUser } from "@/lib/auth/policies";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, type Result } from "@/lib/result";

async function tryAddLine(
  productId: string,
  quantity: number,
  modifiers: CartModifiers,
): Promise<boolean> {
  try {
    await addToCart(productId, quantity, modifiers);
    return true;
  } catch {
    return false;
  }
}

/**
 * Re-adds available products from a customer-owned order into the active cart,
 * then redirects to checkout. Skips missing, inactive, out-of-stock, or
 * customization-incompatible lines.
 */
export async function reorderCustomerOrderAction(
  locale: string,
  orderNumber: string,
): Promise<Result<null>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const trimmed = orderNumber.trim();
  if (!trimmed || trimmed.length > 64) {
    return err("VALIDATION_ERROR", "Invalid order number.");
  }

  const user = await requireUser(locale as Locale);
  const loaded = await getAdminOrderByNumber(trimmed);

  if (!loaded || loaded.order.userId !== user.id) {
    return err("NOT_FOUND", "Order not found.");
  }

  let added = 0;

  for (const item of loaded.items) {
    if (!item.productId) {
      continue;
    }

    const fromSnapshot = cartModifiersFromOrderSnapshot(item.modifiersSnapshot);
    const withSnapshot = await tryAddLine(
      item.productId,
      item.quantity,
      fromSnapshot,
    );
    if (withSnapshot) {
      added += 1;
      continue;
    }

    if (
      !isEmptyModifiers(fromSnapshot) &&
      (await tryAddLine(item.productId, item.quantity, EMPTY_CART_MODIFIERS))
    ) {
      added += 1;
    }
  }

  if (added < 1) {
    return err(
      "NO_AVAILABLE_PRODUCTS",
      "None of the products from this order are available.",
    );
  }

  redirect(`/${locale}/checkout`);
}
