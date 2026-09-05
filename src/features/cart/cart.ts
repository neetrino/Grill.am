"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import { cartItems, products } from "@/db/schema";
import {
  applyAddCartLineQuantity,
  applySetCartLineQuantity,
} from "@/features/cart/cart-line-mutation";
import type { SetCartLineQuantityInput } from "@/features/cart/cart-line-types";
import {
  findActiveCart,
  getOrCreateCartForOwner,
  type CartRow,
} from "@/features/cart/cart-owner";
import {
  getGuestCartToken,
  hashGuestToken,
  peekGuestCartToken,
} from "@/features/cart/guest-token";
import {
  parseCartModifiers,
  type CartModifiers,
} from "@/features/products/domain/customization";
import { getCurrentUser } from "@/lib/auth/session";

type CartItemWithProduct = {
  item: typeof cartItems.$inferSelect;
  product: typeof products.$inferSelect;
};

const DURABLE_ITEM_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getCartOwnerForWrite(): Promise<{
  userId?: string;
  guestTokenHash?: string;
}> {
  const user = await getCurrentUser();
  if (user) return { userId: user.id };
  return { guestTokenHash: hashGuestToken(await getGuestCartToken()) };
}

/** Owner for read paths — never creates a guest cookie or cart row. */
async function getCartOwnerForRead(): Promise<{
  userId?: string;
  guestTokenHash?: string;
} | null> {
  const user = await getCurrentUser();
  if (user) return { userId: user.id };

  const token = await peekGuestCartToken();
  if (!token) return null;

  return { guestTokenHash: hashGuestToken(token) };
}

function assertDurableItemId(itemId: string): void {
  if (!DURABLE_ITEM_ID.test(itemId)) {
    throw new Error("Invalid cart item.");
  }
}

/** Returns the caller's active durable cart, creating it when absent. */
export async function getOrCreateCart(): Promise<CartRow> {
  return getOrCreateCartForOwner(await getCartOwnerForWrite());
}

/** Loads cart lines without creating a cart or guest cookie.
 * Used by header, cart page, and checkout reads.
 */
export async function getCartWithItems(): Promise<{
  cart: CartRow | null;
  items: CartItemWithProduct[];
}> {
  const owner = await getCartOwnerForRead();
  if (!owner) {
    return { cart: null, items: [] };
  }

  const cart = await findActiveCart(owner);
  if (!cart) {
    return { cart: null, items: [] };
  }

  const items = await getDb()
    .select({ item: cartItems, product: products })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));

  return { cart, items };
}

/** Cheap badge count for the header — no cart creation, no line enrichment. */
export async function getCartItemCount(): Promise<number> {
  const owner = await getCartOwnerForRead();
  if (!owner) {
    return 0;
  }

  const cart = await findActiveCart(owner);
  if (!cart) {
    return 0;
  }

  const [row] = await getDb()
    .select({
      total: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int`,
    })
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id));

  return row?.total ?? 0;
}

/**
 * Canonical cart mutation: set absolute quantity for productId + selectionKey.
 * quantity <= 0 deletes the line. Never accepts optimistic client IDs.
 */
export async function setCartLineQuantity(
  input: SetCartLineQuantityInput,
): Promise<void> {
  const cart = await getOrCreateCart();
  await applySetCartLineQuantity(cart.id, input);
  await revalidateCartPaths();
}

export async function addToCart(
  productId: string,
  quantity = 1,
  modifiersInput: CartModifiers = {
    optionChoices: {},
    addonIds: [],
    exclusionIds: [],
  },
): Promise<void> {
  const cart = await getOrCreateCart();
  await applyAddCartLineQuantity(cart.id, {
    productId,
    quantity,
    modifiers: modifiersInput,
  });
  await revalidateCartPaths();
}

export async function updateQuantity(
  itemId: string,
  quantity: number,
): Promise<void> {
  assertDurableItemId(itemId);
  const cart = await getOrCreateCart();
  const [row] = await getDb()
    .select({
      productId: cartItems.productId,
      selectionKey: cartItems.selectionKey,
      modifiers: cartItems.modifiers,
    })
    .from(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
    .limit(1);
  if (!row) {
    return;
  }
  await applySetCartLineQuantity(cart.id, {
    productId: row.productId,
    selectionKey: row.selectionKey,
    quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 0,
    modifiers: parseCartModifiers(row.modifiers),
  });
  await revalidateCartPaths();
}

export async function removeItem(itemId: string): Promise<void> {
  assertDurableItemId(itemId);
  const cart = await getOrCreateCart();
  const [row] = await getDb()
    .select({
      productId: cartItems.productId,
      selectionKey: cartItems.selectionKey,
    })
    .from(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
    .limit(1);
  if (!row) {
    return;
  }
  await applySetCartLineQuantity(cart.id, {
    productId: row.productId,
    selectionKey: row.selectionKey,
    quantity: 0,
  });
  await revalidateCartPaths();
}

/**
 * Refresh cart/checkout router cache after durable mutations.
 * Do not revalidate "/" layout — that marks every ISR PDP stale and
 * bills a Vercel ISR write on the next hit to each product page.
 */
export async function revalidateCartPaths(): Promise<void> {
  revalidatePath("/[locale]/cart", "page");
  revalidatePath("/[locale]/checkout", "page");
}
