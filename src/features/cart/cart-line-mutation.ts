import "server-only";

import { and, eq } from "drizzle-orm";

import { cartItems, carts, products, type TranslationsJson } from "@/db/schema";
import { withTransaction, type DatabaseTransaction } from "@/db/transaction";
import { assertCartLineQuantityWithinStock } from "@/features/cart/cart-line-stock";
import type { SetCartLineQuantityInput } from "@/features/cart/cart-line-types";
import {
  EMPTY_CART_MODIFIERS,
  parseCartModifiers,
  parseProductCustomization,
  selectionKeyFromModifiers,
  validateModifiers,
  type CartModifiers,
} from "@/features/products/domain/customization";
import {
  assertPositiveQuantityMeetsMinOrder,
  minOrderQuantityFromTranslations,
} from "@/features/products/domain/min-order-quantity";
import { createId } from "@/lib/id";
import { logger } from "@/lib/observability/logger";

export type { SetCartLineQuantityInput };

export type AddCartLineQuantityInput = {
  productId: string;
  quantity: number;
  modifiers?: CartModifiers;
};

type ProductStockRow = {
  id: string;
  stock: number;
  status: string;
  customization: unknown;
  translations: TranslationsJson;
};

type CartLineQtyRow = {
  quantity: number;
  selectionKey: string;
  modifiers: unknown;
};

const MAX_CART_LINE_QUANTITY = 99_999;

function assertQuantity(quantity: number): void {
  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > MAX_CART_LINE_QUANTITY
  ) {
    throw new Error("Invalid quantity.");
  }
}

async function lockActiveCart(
  tx: DatabaseTransaction,
  cartId: string,
): Promise<void> {
  const [cart] = await tx
    .select({ id: carts.id, status: carts.status })
    .from(carts)
    .where(eq(carts.id, cartId))
    .for("update")
    .limit(1);
  if (!cart || cart.status !== "ACTIVE") {
    throw new Error("Cart unavailable.");
  }
}

async function lockProduct(
  tx: DatabaseTransaction,
  productId: string,
): Promise<ProductStockRow | null> {
  const [product] = await tx
    .select({
      id: products.id,
      stock: products.stockOnHand,
      status: products.status,
      customization: products.customization,
      translations: products.translations,
    })
    .from(products)
    .where(eq(products.id, productId))
    .for("update")
    .limit(1);
  return product ?? null;
}

async function lockProductLines(
  tx: DatabaseTransaction,
  cartId: string,
  productId: string,
): Promise<CartLineQtyRow[]> {
  return tx
    .select({
      quantity: cartItems.quantity,
      selectionKey: cartItems.selectionKey,
      modifiers: cartItems.modifiers,
    })
    .from(cartItems)
    .where(
      and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)),
    )
    .for("update");
}

function resolveValidatedModifiers(
  product: ProductStockRow,
  lines: CartLineQtyRow[],
  selectionKey: string,
  modifiersInput: CartModifiers | undefined,
): CartModifiers {
  const raw =
    modifiersInput ??
    parseCartModifiers(
      lines.find((line) => line.selectionKey === selectionKey)?.modifiers,
    );
  const validated = validateModifiers(
    parseProductCustomization(product.customization),
    parseCartModifiers(raw ?? EMPTY_CART_MODIFIERS),
  );
  if (!validated.ok) {
    throw new Error(validated.error);
  }
  const expectedKey = selectionKeyFromModifiers(validated.modifiers);
  if (expectedKey !== selectionKey) {
    throw new Error("Invalid selection.");
  }
  return validated.modifiers;
}

async function deleteCartLine(
  tx: DatabaseTransaction,
  cartId: string,
  productId: string,
  selectionKey: string,
): Promise<void> {
  await tx
    .delete(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cartId),
        eq(cartItems.productId, productId),
        eq(cartItems.selectionKey, selectionKey),
      ),
    );
}

async function upsertCartLine(
  tx: DatabaseTransaction,
  input: {
    cartId: string;
    productId: string;
    selectionKey: string;
    quantity: number;
    modifiers: CartModifiers;
  },
): Promise<void> {
  await tx
    .insert(cartItems)
    .values({
      id: createId(),
      cartId: input.cartId,
      productId: input.productId,
      quantity: input.quantity,
      modifiers: input.modifiers,
      selectionKey: input.selectionKey,
    })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId, cartItems.selectionKey],
      set: {
        quantity: input.quantity,
        modifiers: input.modifiers,
        updatedAt: new Date(),
      },
    });
}

function targetQuantity(
  mode: "set" | "add",
  requested: number,
  matchingQty: number,
): number {
  if (mode === "set") {
    return requested;
  }
  return matchingQty + requested;
}

async function mutateCartLineInTx(
  tx: DatabaseTransaction,
  cartId: string,
  productId: string,
  selectionKey: string,
  requestedQuantity: number,
  mode: "set" | "add",
  modifiersInput: CartModifiers | undefined,
): Promise<void> {
  const product = await lockProduct(tx, productId);
  await lockActiveCart(tx, cartId);
  const lines = await lockProductLines(tx, cartId, productId);
  const matchingQty =
    lines.find((line) => line.selectionKey === selectionKey)?.quantity ?? 0;
  const quantity = targetQuantity(mode, requestedQuantity, matchingQty);

  if (quantity <= 0) {
    await deleteCartLine(tx, cartId, productId, selectionKey);
    return;
  }

  if (!product || product.status !== "ACTIVE" || product.stock < 1) {
    throw new Error("Product unavailable.");
  }

  assertPositiveQuantityMeetsMinOrder(
    quantity,
    minOrderQuantityFromTranslations(product.translations),
  );

  const modifiers = resolveValidatedModifiers(
    product,
    lines,
    selectionKey,
    modifiersInput,
  );
  const quantityOnOtherLines = lines
    .filter((line) => line.selectionKey !== selectionKey)
    .reduce((sum, line) => sum + line.quantity, 0);
  assertCartLineQuantityWithinStock(
    product.stock,
    quantityOnOtherLines,
    quantity,
  );
  await upsertCartLine(tx, {
    cartId,
    productId,
    selectionKey,
    quantity,
    modifiers,
  });
}

async function runCartLineMutation(
  cartId: string,
  productId: string,
  selectionKey: string,
  requestedQuantity: number,
  mode: "set" | "add",
  modifiersInput: CartModifiers | undefined,
): Promise<void> {
  try {
    await withTransaction(async (tx) => {
      await mutateCartLineInTx(
        tx,
        cartId,
        productId,
        selectionKey,
        requestedQuantity,
        mode,
        modifiersInput,
      );
    });
  } catch (error) {
    logger.warn("cart.line_mutation_failed", {
      cartId,
      productId,
      selectionKey,
      quantity: requestedQuantity,
      mode,
    });
    throw error;
  }
}

/** Sets an absolute quantity inside an existing transaction (tests + shared write path). */
export async function applySetCartLineQuantityInTx(
  tx: DatabaseTransaction,
  cartId: string,
  input: SetCartLineQuantityInput,
): Promise<void> {
  assertQuantity(input.quantity);
  await mutateCartLineInTx(
    tx,
    cartId,
    input.productId,
    input.selectionKey,
    input.quantity,
    "set",
    input.modifiers,
  );
}

/** Sets an absolute quantity for one cart line (0 deletes the line). */
export async function applySetCartLineQuantity(
  cartId: string,
  input: SetCartLineQuantityInput,
): Promise<void> {
  assertQuantity(input.quantity);
  await runCartLineMutation(
    cartId,
    input.productId,
    input.selectionKey,
    input.quantity,
    "set",
    input.modifiers,
  );
}

/** Adds quantity to a line identified by validated modifiers (creates if needed). */
export async function applyAddCartLineQuantity(
  cartId: string,
  input: AddCartLineQuantityInput,
): Promise<void> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("Invalid quantity.");
  }
  const modifiers = parseCartModifiers(
    input.modifiers ?? EMPTY_CART_MODIFIERS,
  );
  const selectionKey = selectionKeyFromModifiers(modifiers);
  await runCartLineMutation(
    cartId,
    input.productId,
    selectionKey,
    input.quantity,
    "add",
    modifiers,
  );
}
