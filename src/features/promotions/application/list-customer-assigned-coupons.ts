import "server-only";

import { and, desc, eq, isNotNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders, promotions, promotionUsers } from "@/db/schema";
import { isCouponCurrentlyAvailable } from "@/features/promotions/domain/evaluate-coupon";

const ASSIGNED_COUPONS_LIMIT = 50;

export type CustomerAssignedCoupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minimumOrderAmount: number | null;
  endsAt: Date | null;
};

/**
 * Personal coupons allowlisted for this customer.
 * Does not list unrestricted/public codes.
 */
export async function listCustomerAssignedCoupons(
  userId: string,
): Promise<CustomerAssignedCoupon[]> {
  const [assignedRows, redeemedRows] = await Promise.all([
    getDb()
      .select({
        id: promotions.id,
        code: promotions.code,
        discountType: promotions.discountType,
        discountValue: promotions.discountValue,
        minimumOrderAmount: promotions.minimumOrderAmount,
        endsAt: promotions.endsAt,
        isActive: promotions.isActive,
        startsAt: promotions.startsAt,
        totalUsageLimit: promotions.totalUsageLimit,
        usedCount: promotions.usedCount,
      })
      .from(promotionUsers)
      .innerJoin(promotions, eq(promotions.id, promotionUsers.promotionId))
      .where(
        and(
          eq(promotionUsers.userId, userId),
          eq(promotions.kind, "COUPON"),
          eq(promotions.isActive, true),
          isNotNull(promotions.code),
        ),
      )
      .orderBy(desc(promotions.createdAt))
      .limit(ASSIGNED_COUPONS_LIMIT),
    getDb()
      .select({ promotionId: orders.promotionId })
      .from(orders)
      .where(and(eq(orders.userId, userId), isNotNull(orders.promotionId))),
  ]);

  const redeemedIds = new Set(
    redeemedRows
      .map((row) => row.promotionId)
      .filter((id): id is string => id !== null),
  );
  const now = new Date();

  return assignedRows.flatMap((row) => {
    if (redeemedIds.has(row.id) || !row.code) {
      return [];
    }
    if (
      !isCouponCurrentlyAvailable(
        {
          isActive: row.isActive,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
          totalUsageLimit: row.totalUsageLimit,
          usedCount: row.usedCount,
        },
        now,
      )
    ) {
      return [];
    }
    return [
      {
        id: row.id,
        code: row.code,
        discountType: row.discountType,
        discountValue: row.discountValue,
        minimumOrderAmount: row.minimumOrderAmount,
        endsAt: row.endsAt,
      },
    ];
  });
}
