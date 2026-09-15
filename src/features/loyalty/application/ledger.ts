import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { bonusLedger, orders, users } from "@/db/schema";
import type { DatabaseTransaction } from "@/db/transaction";
import { createId } from "@/lib/id";

type BonusLedgerEntryType =
  | "EARN"
  | "SPEND"
  | "SPEND_REVERSAL"
  | "EARN_REVERSAL";

async function lockUserBalance(
  tx: DatabaseTransaction,
  userId: string,
): Promise<number> {
  const [row] = await tx
    .select({ bonusBalanceAmount: users.bonusBalanceAmount })
    .from(users)
    .where(eq(users.id, userId))
    .for("update")
    .limit(1);

  if (!row) {
    throw new Error("LOYALTY_USER_NOT_FOUND");
  }

  return row.bonusBalanceAmount;
}

async function applyLedgerEntry(
  tx: DatabaseTransaction,
  input: {
    userId: string;
    orderId: string | null;
    entryType: BonusLedgerEntryType;
    amount: number;
    note?: string;
  },
): Promise<number> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("LOYALTY_INVALID_AMOUNT");
  }

  const current = await lockUserBalance(tx, input.userId);
  const delta =
    input.entryType === "EARN" || input.entryType === "SPEND_REVERSAL"
      ? input.amount
      : -input.amount;
  const next = current + delta;
  if (next < 0) {
    throw new Error("LOYALTY_INSUFFICIENT_BALANCE");
  }

  await tx
    .update(users)
    .set({
      bonusBalanceAmount: next,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId));

  await tx.insert(bonusLedger).values({
    id: createId(),
    userId: input.userId,
    orderId: input.orderId,
    entryType: input.entryType,
    amount: input.amount,
    balanceAfter: next,
    note: input.note ?? null,
  });

  return next;
}

/** Deducts bonus for an order (idempotent via unique SPEND index). */
export async function spendBonusForOrder(
  tx: DatabaseTransaction,
  input: {
    userId: string;
    orderId: string;
    amount: number;
  },
): Promise<void> {
  if (input.amount <= 0) {
    return;
  }

  try {
    await applyLedgerEntry(tx, {
      userId: input.userId,
      orderId: input.orderId,
      entryType: "SPEND",
      amount: input.amount,
      note: "checkout",
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return;
    }
    throw error;
  }
}

/**
 * Credits planned earn once payment is Paid (`CAPTURED`).
 * Idempotent via unique EARN index + bonusEarnedAppliedAt guard.
 */
export async function applyBonusEarnForOrder(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<void> {
  const [order] = await tx
    .select({
      id: orders.id,
      userId: orders.userId,
      bonusEarnedAmount: orders.bonusEarnedAmount,
      bonusEarnedAppliedAt: orders.bonusEarnedAppliedAt,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for("update")
    .limit(1);

  if (!order?.userId || order.bonusEarnedAmount <= 0) {
    return;
  }
  if (order.paymentStatus !== "CAPTURED") {
    return;
  }
  if (order.bonusEarnedAppliedAt != null) {
    return;
  }

  const now = new Date();
  try {
    await applyLedgerEntry(tx, {
      userId: order.userId,
      orderId: order.id,
      entryType: "EARN",
      amount: order.bonusEarnedAmount,
      note: "order_earn",
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  await tx
    .update(orders)
    .set({ bonusEarnedAppliedAt: now, updatedAt: now })
    .where(
      and(eq(orders.id, order.id), sql`${orders.bonusEarnedAppliedAt} IS NULL`),
    );
}

/** Restores spent bonus when an unpaid attempt fails (idempotent). */
export async function reverseBonusSpendForOrder(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<void> {
  const [order] = await tx
    .select({
      id: orders.id,
      userId: orders.userId,
      bonusSpentAmount: orders.bonusSpentAmount,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for("update")
    .limit(1);

  if (!order?.userId || order.bonusSpentAmount <= 0) {
    return;
  }
  if (order.paymentStatus === "CAPTURED" || order.paymentStatus === "REFUNDED") {
    return;
  }

  const [existingReversal] = await tx
    .select({ id: bonusLedger.id })
    .from(bonusLedger)
    .where(
      and(
        eq(bonusLedger.orderId, order.id),
        eq(bonusLedger.entryType, "SPEND_REVERSAL"),
      ),
    )
    .limit(1);

  if (existingReversal) {
    return;
  }

  const [spend] = await tx
    .select({ id: bonusLedger.id })
    .from(bonusLedger)
    .where(
      and(eq(bonusLedger.orderId, order.id), eq(bonusLedger.entryType, "SPEND")),
    )
    .limit(1);

  if (!spend) {
    return;
  }

  await applyLedgerEntry(tx, {
    userId: order.userId,
    orderId: order.id,
    entryType: "SPEND_REVERSAL",
    amount: order.bonusSpentAmount,
    note: "payment_failed",
  });
}

/** Restores spent bonus after a refund (idempotent). */
export async function restoreBonusSpendAfterRefund(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<void> {
  const [order] = await tx
    .select({
      id: orders.id,
      userId: orders.userId,
      bonusSpentAmount: orders.bonusSpentAmount,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for("update")
    .limit(1);

  if (!order?.userId || order.bonusSpentAmount <= 0) {
    return;
  }

  const [existingReversal] = await tx
    .select({ id: bonusLedger.id })
    .from(bonusLedger)
    .where(
      and(
        eq(bonusLedger.orderId, order.id),
        eq(bonusLedger.entryType, "SPEND_REVERSAL"),
      ),
    )
    .limit(1);

  if (existingReversal) {
    return;
  }

  const [spend] = await tx
    .select({ id: bonusLedger.id })
    .from(bonusLedger)
    .where(
      and(eq(bonusLedger.orderId, order.id), eq(bonusLedger.entryType, "SPEND")),
    )
    .limit(1);

  if (!spend) {
    return;
  }

  await applyLedgerEntry(tx, {
    userId: order.userId,
    orderId: order.id,
    entryType: "SPEND_REVERSAL",
    amount: order.bonusSpentAmount,
    note: "order_refunded",
  });
}

/** Revokes credited earn after a full refund (idempotent). */
export async function reverseBonusEarnForOrder(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<void> {
  const [order] = await tx
    .select({
      id: orders.id,
      userId: orders.userId,
      bonusEarnedAmount: orders.bonusEarnedAmount,
      bonusEarnedAppliedAt: orders.bonusEarnedAppliedAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for("update")
    .limit(1);

  if (
    !order?.userId ||
    order.bonusEarnedAmount <= 0 ||
    order.bonusEarnedAppliedAt == null
  ) {
    return;
  }

  const [existingReversal] = await tx
    .select({ id: bonusLedger.id })
    .from(bonusLedger)
    .where(
      and(
        eq(bonusLedger.orderId, order.id),
        eq(bonusLedger.entryType, "EARN_REVERSAL"),
      ),
    )
    .limit(1);

  if (existingReversal) {
    return;
  }

  try {
    await applyLedgerEntry(tx, {
      userId: order.userId,
      orderId: order.id,
      entryType: "EARN_REVERSAL",
      amount: order.bonusEarnedAmount,
      note: "order_refunded",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "LOYALTY_INSUFFICIENT_BALANCE") {
      // Clamp reversal to remaining balance so refund still completes.
      const balance = await lockUserBalance(tx, order.userId);
      if (balance <= 0) {
        return;
      }
      await applyLedgerEntry(tx, {
        userId: order.userId,
        orderId: order.id,
        entryType: "EARN_REVERSAL",
        amount: Math.min(balance, order.bonusEarnedAmount),
        note: "order_refunded_partial",
      });
      return;
    }
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: string }).code;
  return code === "23505";
}
