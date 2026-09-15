import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import { cache } from "react";

import { getDb } from "@/db/client";
import { bonusLedger, orders, users } from "@/db/schema";
import { getStoreLoyalty } from "@/features/settings/application/queries";
import {
  computeMaxBonusRedeemAmount,
  merchandiseNetAmount,
} from "@/features/loyalty/domain/loyalty-math";
import type { StoreLoyalty } from "@/features/settings/domain/store-settings";

export type CustomerBonusSummary = {
  balanceAmount: number;
  totalEarnedAmount: number;
  totalSpentAmount: number;
  loyalty: StoreLoyalty;
};

export type CustomerBonusLedgerRow = {
  id: string;
  entryType: "EARN" | "SPEND" | "SPEND_REVERSAL" | "EARN_REVERSAL";
  amount: number;
  balanceAfter: number;
  createdAt: string;
  orderNumber: string | null;
  orderId: string | null;
};

export type CheckoutBonusContext = {
  balanceAmount: number;
  earnPercent: number;
  earnMinOrderAmount: number | null;
  maxRedeemAmount: number;
};

export const getUserBonusBalance = cache(
  async (userId: string): Promise<number> => {
    const [row] = await getDb()
      .select({ bonusBalanceAmount: users.bonusBalanceAmount })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row?.bonusBalanceAmount ?? 0;
  },
);

export async function getCustomerBonusSummary(
  userId: string,
): Promise<CustomerBonusSummary> {
  const [balance, loyalty, aggregates] = await Promise.all([
    getUserBonusBalance(userId),
    getStoreLoyalty(),
    getDb()
      .select({
        totalEarned: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'EARN' then ${bonusLedger.amount} else 0 end), 0)`,
        totalSpent: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'SPEND' then ${bonusLedger.amount} else 0 end), 0)`,
        totalSpendReversed: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'SPEND_REVERSAL' then ${bonusLedger.amount} else 0 end), 0)`,
        totalEarnReversed: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'EARN_REVERSAL' then ${bonusLedger.amount} else 0 end), 0)`,
      })
      .from(bonusLedger)
      .where(eq(bonusLedger.userId, userId)),
  ]);

  const row = aggregates[0];
  return {
    balanceAmount: balance,
    totalEarnedAmount: Math.max(
      0,
      Number(row?.totalEarned ?? 0) - Number(row?.totalEarnReversed ?? 0),
    ),
    totalSpentAmount: Math.max(
      0,
      Number(row?.totalSpent ?? 0) - Number(row?.totalSpendReversed ?? 0),
    ),
    loyalty,
  };
}

export async function listCustomerBonusLedger(
  userId: string,
  page: number,
  pageSize = 20,
): Promise<{ rows: CustomerBonusLedgerRow[]; total: number; pageSize: number }> {
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  const [countRow] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(bonusLedger)
    .where(eq(bonusLedger.userId, userId));

  const rows = await getDb()
    .select({
      id: bonusLedger.id,
      entryType: bonusLedger.entryType,
      amount: bonusLedger.amount,
      balanceAfter: bonusLedger.balanceAfter,
      createdAt: bonusLedger.createdAt,
      orderId: bonusLedger.orderId,
      orderNumber: orders.orderNumber,
    })
    .from(bonusLedger)
    .leftJoin(orders, eq(bonusLedger.orderId, orders.id))
    .where(eq(bonusLedger.userId, userId))
    .orderBy(desc(bonusLedger.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    pageSize,
    total: Number(countRow?.count ?? 0),
    rows: rows.map((row) => ({
      id: row.id,
      entryType: row.entryType,
      amount: row.amount,
      balanceAfter: row.balanceAfter,
      createdAt: row.createdAt.toISOString(),
      orderId: row.orderId,
      orderNumber: row.orderNumber,
    })),
  };
}

/** Checkout preview: balance + max redeem for current cart merchandise. */
export async function getCheckoutBonusContext(input: {
  userId: string | null | undefined;
  subtotalAmount: number;
  discountAmount: number;
  deliveryAmount: number;
}): Promise<CheckoutBonusContext | null> {
  if (!input.userId) {
    return null;
  }

  const [balance, loyalty] = await Promise.all([
    getUserBonusBalance(input.userId),
    getStoreLoyalty(),
  ]);

  const merchandiseNet = merchandiseNetAmount(
    input.subtotalAmount,
    input.discountAmount,
  );
  const maxRedeemAmount = computeMaxBonusRedeemAmount({
    merchandiseNet,
    deliveryAmount: input.deliveryAmount,
    balanceAmount: balance,
  });

  return {
    balanceAmount: balance,
    earnPercent: loyalty.earnPercent,
    earnMinOrderAmount: loyalty.earnMinOrderAmount,
    maxRedeemAmount,
  };
}

/** Admin/profile order drawer helper: ledger lines for one order. */
export async function getOrderBonusSnapshot(orderId: string): Promise<{
  spentAmount: number;
  earnedAmount: number;
  earnedApplied: boolean;
} | null> {
  const [order] = await getDb()
    .select({
      bonusSpentAmount: orders.bonusSpentAmount,
      bonusEarnedAmount: orders.bonusEarnedAmount,
      bonusEarnedAppliedAt: orders.bonusEarnedAppliedAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    return null;
  }

  return {
    spentAmount: order.bonusSpentAmount,
    earnedAmount: order.bonusEarnedAmount,
    earnedApplied: order.bonusEarnedAppliedAt != null,
  };
}

export async function listOrderBonusLedger(orderId: string) {
  return getDb()
    .select({
      entryType: bonusLedger.entryType,
      amount: bonusLedger.amount,
      createdAt: bonusLedger.createdAt,
    })
    .from(bonusLedger)
    .where(eq(bonusLedger.orderId, orderId))
    .orderBy(desc(bonusLedger.createdAt));
}
