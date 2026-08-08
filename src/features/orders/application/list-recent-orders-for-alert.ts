import "server-only";

import { and, asc, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";

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
 * Ordered oldest-first so the client can present a FIFO acknowledge queue.
 */
export async function listRecentOrdersForAlert(
  since: Date,
): Promise<NewOrderAlertItem[]> {
  const rows = await getDb()
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      contactName: orders.contactName,
      totalAmount: orders.totalAmount,
      baseCurrency: orders.baseCurrency,
      paymentMethod: sql<string | null>`
        (
          select ${payments.method}
          from ${payments}
          where ${payments.orderId} = ${orders.id}
          order by ${payments.attemptNumber} desc
          limit 1
        )
      `,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(
      and(eq(orders.isArchived, false), gte(orders.placedAt, since)),
    )
    .orderBy(asc(orders.placedAt))
    .limit(NEW_ORDER_ALERT_MAX_ROWS);

  return rows;
}
