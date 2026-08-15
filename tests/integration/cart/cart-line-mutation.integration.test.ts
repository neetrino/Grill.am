import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

import { cartItems, carts, products, users } from "@/db/schema";
import { getDb } from "@/db/client";
import type { DatabaseTransaction } from "@/db/transaction";
import { applySetCartLineQuantityInTx } from "@/features/cart/cart-line-mutation";
import { getOrCreateCartForOwner } from "@/features/cart/cart-owner";
import { createId } from "@/lib/id";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";

async function insertProduct(
  tx: DatabaseTransaction,
  stockOnHand: number,
): Promise<string> {
  const productId = createId();
  await tx.insert(products).values({
    id: productId,
    sku: `CART-${productId}`,
    status: "ACTIVE",
    priceAmount: 1000,
    stockOnHand,
    translations: {
      hy: { title: "Cart Test", slug: `hy-${productId}` },
      en: { title: "Cart Test", slug: `en-${productId}` },
      ru: { title: "Cart Test", slug: `ru-${productId}` },
    },
  });
  return productId;
}

async function insertGuestCart(
  tx: DatabaseTransaction,
  guestTokenHash: string,
): Promise<string> {
  const cartId = createId();
  await tx.insert(carts).values({
    id: cartId,
    guestTokenHash,
    status: "ACTIVE",
  });
  return cartId;
}

describe("cart line mutation integration", () => {
  let db: IntegrationDb | undefined;

  beforeAll(async () => {
    db = await openIntegrationDb();
  });

  afterAll(async () => {
    await db?.close();
  });

  function requireDb(): IntegrationDb {
    if (!db) {
      throw new Error("Integration database is not open.");
    }
    return db;
  }

  it("rejects quantity above stock and leaves the line unchanged", async () => {
    const { cartId, productId } = await requireDb().withTx(async (tx) => {
      const productId = await insertProduct(tx as DatabaseTransaction, 5);
      const cartId = await insertGuestCart(
        tx as DatabaseTransaction,
        `guest-${createId()}`,
      );
      await applySetCartLineQuantityInTx(tx as DatabaseTransaction, cartId, {
        productId,
        selectionKey: "",
        quantity: 1,
      });
      return { cartId, productId };
    });

    await expect(
      requireDb().withTx(async (tx) => {
        await applySetCartLineQuantityInTx(tx as DatabaseTransaction, cartId, {
          productId,
          selectionKey: "",
          quantity: 6,
        });
      }),
    ).rejects.toThrow("Product unavailable.");

    const rows = await requireDb().withTx((tx) =>
      tx
        .select()
        .from(cartItems)
        .where(
          and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)),
        ),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.quantity).toBe(1);

    await requireDb().withTx(async (tx) => {
      await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
      await tx.delete(carts).where(eq(carts.id, cartId));
      await tx.delete(products).where(eq(products.id, productId));
    });
  });

  it("does not let two selectionKeys exceed shared product stock", async () => {
    const keyA = '{"addonIds":["a"]}';
    const { cartId, productId } = await requireDb().withTx(async (tx) => {
      const productId = await insertProduct(tx as DatabaseTransaction, 5);
      const cartId = await insertGuestCart(
        tx as DatabaseTransaction,
        `guest-${createId()}`,
      );
      return { cartId, productId };
    });

    // Empty modifiers only — customized keys require valid catalogs.
    // Use two empty vs non-empty via distinct selection by upserting after
    // inserting lines directly, then validating the set path against totals.
    await requireDb().withTx(async (tx) => {
      await tx.insert(cartItems).values({
        id: createId(),
        cartId,
        productId,
        quantity: 3,
        selectionKey: "",
        modifiers: { optionChoices: {}, addonIds: [], exclusionIds: [] },
      });
      await tx.insert(cartItems).values({
        id: createId(),
        cartId,
        productId,
        quantity: 2,
        selectionKey: keyA,
        modifiers: { optionChoices: {}, addonIds: [], exclusionIds: [] },
      });
    });

    await expect(
      requireDb().withTx(async (tx) => {
        await applySetCartLineQuantityInTx(tx as DatabaseTransaction, cartId, {
          productId,
          selectionKey: "",
          quantity: 4,
        });
      }),
    ).rejects.toThrow("Product unavailable.");

    await requireDb().withTx(async (tx) => {
      await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
      await tx.delete(carts).where(eq(carts.id, cartId));
      await tx.delete(products).where(eq(products.id, productId));
    });
  });

  it("upserts the same line instead of inserting duplicates", async () => {
    const { cartId, productId } = await requireDb().withTx(async (tx) => {
      const productId = await insertProduct(tx as DatabaseTransaction, 10);
      const cartId = await insertGuestCart(
        tx as DatabaseTransaction,
        `guest-${createId()}`,
      );
      await applySetCartLineQuantityInTx(tx as DatabaseTransaction, cartId, {
        productId,
        selectionKey: "",
        quantity: 1,
      });
      await applySetCartLineQuantityInTx(tx as DatabaseTransaction, cartId, {
        productId,
        selectionKey: "",
        quantity: 3,
      });
      return { cartId, productId };
    });

    const rows = await requireDb().withTx((tx) =>
      tx.select().from(cartItems).where(eq(cartItems.cartId, cartId)),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.quantity).toBe(3);

    await requireDb().withTx(async (tx) => {
      await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
      await tx.delete(carts).where(eq(carts.id, cartId));
      await tx.delete(products).where(eq(products.id, productId));
    });
  });

  it("deletes a line when quantity is 0", async () => {
    const { cartId, productId } = await requireDb().withTx(async (tx) => {
      const productId = await insertProduct(tx as DatabaseTransaction, 10);
      const cartId = await insertGuestCart(
        tx as DatabaseTransaction,
        `guest-${createId()}`,
      );
      await applySetCartLineQuantityInTx(tx as DatabaseTransaction, cartId, {
        productId,
        selectionKey: "",
        quantity: 2,
      });
      await applySetCartLineQuantityInTx(tx as DatabaseTransaction, cartId, {
        productId,
        selectionKey: "",
        quantity: 0,
      });
      return { cartId, productId };
    });

    const rows = await requireDb().withTx((tx) =>
      tx.select().from(cartItems).where(eq(cartItems.cartId, cartId)),
    );
    expect(rows).toHaveLength(0);

    await requireDb().withTx(async (tx) => {
      await tx.delete(carts).where(eq(carts.id, cartId));
      await tx.delete(products).where(eq(products.id, productId));
    });
  });

  it("recovers concurrent guest cart creation to a single ACTIVE cart", async () => {
    const guestTokenHash = `guest-race-${createId()}`;
    const [a, b] = await Promise.all([
      getOrCreateCartForOwner({ guestTokenHash }),
      getOrCreateCartForOwner({ guestTokenHash }),
    ]);
    expect(a.id).toBe(b.id);

    const rows = await getDb()
      .select()
      .from(carts)
      .where(
        and(
          eq(carts.guestTokenHash, guestTokenHash),
          eq(carts.status, "ACTIVE"),
        ),
      );
    expect(rows).toHaveLength(1);

    await getDb().delete(carts).where(eq(carts.id, a.id));
  });

  it("recovers concurrent authenticated cart creation to a single ACTIVE cart", async () => {
    const userId = createId();
    await getDb().insert(users).values({
      id: userId,
      email: `cart-${userId}@example.com`,
      passwordHash: "test-hash",
      passwordUpdatedAt: new Date(),
      firstName: "Cart",
      lastName: "Test",
      role: "CUSTOMER",
      status: "ACTIVE",
    });
    const [a, b] = await Promise.all([
      getOrCreateCartForOwner({ userId }),
      getOrCreateCartForOwner({ userId }),
    ]);
    expect(a.id).toBe(b.id);

    const rows = await getDb()
      .select()
      .from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.status, "ACTIVE")));
    expect(rows).toHaveLength(1);

    await getDb().delete(carts).where(eq(carts.id, a.id));
    await getDb().delete(users).where(eq(users.id, userId));
  });
});
