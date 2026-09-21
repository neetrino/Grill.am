import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

import { REVENUE_EXCLUDED_ORDER_STATUSES } from "@/features/analytics/domain/revenue-contribution";

function sqlList(values: readonly string[]): SQL {
  return sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  );
}

/**
 * Amount counted in analytics.
 * Cancelled and refunded orders contribute 0.
 */
export function includedAmountSql(input: {
  amount: SQLWrapper;
  orderStatus: SQLWrapper;
}): SQL<number> {
  const excluded = sqlList(REVENUE_EXCLUDED_ORDER_STATUSES);
  return sql<number>`case
    when ${input.orderStatus} in (${excluded}) then 0
    else ${input.amount}
  end`;
}

/** Sum of included revenue amounts, never null. */
export function sumIncludedRevenueSql(input: {
  amount: SQLWrapper;
  orderStatus: SQLWrapper;
}): SQL<number> {
  return sql<number>`coalesce(sum(${includedAmountSql(input)}), 0)`.mapWith(
    Number,
  );
}
