import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { carts } from "@/db/schema";
import { isUniqueViolation } from "@/features/cart/postgres-errors";
import { createId } from "@/lib/id";

export type CartOwner = {
  userId?: string;
  guestTokenHash?: string;
};

export type CartRow = typeof carts.$inferSelect;

export function cartOwnerCondition(owner: CartOwner) {
  if (owner.userId) {
    return eq(carts.userId, owner.userId);
  }
  return eq(carts.guestTokenHash, owner.guestTokenHash!);
}

/** Returns the caller's active cart without creating one. */
export async function findActiveCart(
  owner: CartOwner,
): Promise<CartRow | null> {
  const [existing] = await getDb()
    .select()
    .from(carts)
    .where(and(eq(carts.status, "ACTIVE"), cartOwnerCondition(owner)))
    .limit(1);

  return existing ?? null;
}

/**
 * Returns the active durable cart for an owner, creating it when absent.
 * Recovers from unique-index races by re-reading the winning row.
 */
export async function getOrCreateCartForOwner(
  owner: CartOwner,
): Promise<CartRow> {
  const existing = await findActiveCart(owner);
  if (existing) {
    return existing;
  }

  try {
    const [created] = await getDb()
      .insert(carts)
      .values({ id: createId(), ...owner })
      .returning();
    if (!created) {
      throw new Error("Unable to create cart.");
    }
    return created;
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
    const winner = await findActiveCart(owner);
    if (winner) {
      return winner;
    }
    throw error;
  }
}
