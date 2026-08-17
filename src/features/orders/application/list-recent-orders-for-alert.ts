import "server-only";

import { and, asc, eq, gte, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import {
  latestPaymentMethodSelect,
  latestPaymentProviderSelect,
} from "@/features/orders/application/order-list-selects";

/** How far back the alert poll looks for candidate orders. */
export const NEW_ORDER_ALERT_LOOKBACK_MS = 4 * 60 * 60 * 1000;

/** Max rows returned per poll (FIFO queue cap). */
export const NEW_ORDER_ALERT_MAX_ROWS = 50;

export type NewOrderAlertItem = {
  id: string;
  orderNumber: string;
  contactName: string;
  totalAmount: number;
  baseCurrency: string;
  paymentMethod: string | null;
  placedAt: Date;
};

/**
 * Lists recent non-archived orders for the admin new-order alert poll.
 * Online unpaid attempts stay silent until payment is CAPTURED (or review).
 * COD alerts on place — payment may remain PENDING until delivery.
 * Ordered oldest-first so the client can show the earliest pending alert first.
 */
export async function listRecentOrdersForAlert(
  since: Date,
): Promise<NewOrderAlertItem[]> {
  const latestProvider = latestPaymentProviderSelect();

  const rows = await getDb()
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      contactName: orders.contactName,
      totalAmount: orders.totalAmount,
      baseCurrency: orders.baseCurrency,
      paymentMethod: latestPaymentMethodSelect(),
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.isArchived, false),
        gte(orders.placedAt, since),
        or(
          eq(orders.paymentStatus, "CAPTURED"),
          eq(orders.status, "REQUIRES_REVIEW"),
          sql`${latestProvider} = 'cod'`,
        ),
      ),
    )
    .orderBy(asc(orders.placedAt))
    .limit(NEW_ORDER_ALERT_MAX_ROWS);

  return rows;
}
