import "server-only";

import { sql } from "drizzle-orm";

import { orderItems, payments } from "@/db/schema";

/**
 * Outer-query `orders.id` for correlated subqueries.
 * Drizzle unqualifies `${orders.id}` inside nested `sql` templates, so correlation
 * would bind to the inner table's `id` (e.g. `payments.id`) instead of the order row.
 */
const ORDERS_ID_OUTER = sql.raw('"orders"."id"');

/** Latest payment attempt method for an order row (admin list, dashboard, alerts). */
export function latestPaymentMethodSelect() {
  return sql<string | null>`
    (
      select ${payments.method}
      from ${payments}
      where ${payments.orderId} = ${ORDERS_ID_OUTER}
      order by ${payments.attemptNumber} desc
      limit 1
    )
  `;
}

/** Sum of line-item quantities for an order row (customer order list). */
export function orderItemsCountSelect() {
  return sql<number>`
    coalesce(
      (
        select sum(${orderItems.quantity})
        from ${orderItems}
        where ${orderItems.orderId} = ${ORDERS_ID_OUTER}
      ),
      0
    )
  `.mapWith(Number);
}