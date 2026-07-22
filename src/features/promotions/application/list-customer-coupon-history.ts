import "server-only";

import { and, count, desc, eq, isNotNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders } from "@/db/schema";

const PAGE_SIZE = 20;

export type CustomerCouponRedemption = {
  orderId: string;
  orderNumber: string;
  status: string;
  code: string;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number;
  currency: string;
  placedAt: Date;
};

/**
 * Coupon redemptions for a customer, derived from order promotion snapshots.
 * Does not list browseable/public codes (those stay checkout secrets).
 */
export async function listCustomerCouponHistory(
  userId: string,
  page = 1,
): Promise<{
  rows: CustomerCouponRedemption[];
  total: number;
  pageSize: number;
}> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const offset = (safePage - 1) * PAGE_SIZE;
  const where = and(
    eq(orders.userId, userId),
    isNotNull(orders.promotionId),
    isNotNull(orders.promotionCodeSnapshot),
  );

  const [rows, [totalRow]] = await Promise.all([
    getDb()
      .select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        code: orders.promotionCodeSnapshot,
        discountType: orders.promotionTypeSnapshot,
        discountValue: orders.promotionValueSnapshot,
        discountAmount: orders.promotionDiscountAmount,
        currency: orders.baseCurrency,
        placedAt: orders.placedAt,
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    getDb().select({ value: count() }).from(orders).where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      status: row.status,
      code: row.code ?? "",
      discountType: row.discountType,
      discountValue: row.discountValue,
      discountAmount: row.discountAmount ?? 0,
      currency: row.currency,
      placedAt: row.placedAt,
    })),
    total: totalRow?.value ?? 0,
    pageSize: PAGE_SIZE,
  };
}
