import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  createdAtColumn,
  idColumn,
  updatedAtColumn,
} from "@/db/schema/columns";
import { categories, products } from "@/db/schema/catalog";
import { bonusLedgerEntryTypeEnum } from "@/db/schema/enums";
import { users } from "@/db/schema/identity";
import { orders } from "@/db/schema/orders";

/**
 * Append-only loyalty wallet history.
 * `amount` is always positive; direction is encoded by `entryType`.
 */
export const bonusLedger = pgTable(
  "bonus_ledger",
  {
    id: idColumn(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "restrict",
    }),
    entryType: bonusLedgerEntryTypeEnum("entry_type").notNull(),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    note: text("note"),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("bonus_ledger_user_created_idx").on(table.userId, table.createdAt),
    index("bonus_ledger_order_idx").on(table.orderId),
    uniqueIndex("bonus_ledger_order_earn_uidx")
      .on(table.orderId)
      .where(sql`${table.entryType} = 'EARN' AND ${table.orderId} IS NOT NULL`),
    uniqueIndex("bonus_ledger_order_spend_uidx")
      .on(table.orderId)
      .where(sql`${table.entryType} = 'SPEND' AND ${table.orderId} IS NOT NULL`),
    check("bonus_ledger_amount_pos_chk", sql`${table.amount} > 0`),
    check(
      "bonus_ledger_balance_after_nonneg_chk",
      sql`${table.balanceAfter} >= 0`,
    ),
  ],
);

/**
 * Flat AMD bonus credited per purchased unit of a product (independent of
 * store-wide earn %). Optional window: null bounds mean open-ended.
 */
export const productBonusRules = pgTable(
  "product_bonus_rules",
  {
    id: idColumn(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Bonus AMD credited per unit purchased while the rule is active. */
    amount: integer("amount").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("product_bonus_rules_product_uidx").on(table.productId),
    index("product_bonus_rules_window_idx").on(table.startsAt, table.endsAt),
    check("product_bonus_rules_amount_pos_chk", sql`${table.amount} > 0`),
    check(
      "product_bonus_rules_window_chk",
      sql`${table.startsAt} IS NULL OR ${table.endsAt} IS NULL OR ${table.startsAt} <= ${table.endsAt}`,
    ),
  ],
);

/**
 * Flat AMD bonus for every product in a category (per unit).
 * Product-level rules override category rules at earn time.
 */
export const categoryBonusRules = pgTable(
  "category_bonus_rules",
  {
    id: idColumn(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("category_bonus_rules_category_uidx").on(table.categoryId),
    index("category_bonus_rules_window_idx").on(table.startsAt, table.endsAt),
    check("category_bonus_rules_amount_pos_chk", sql`${table.amount} > 0`),
    check(
      "category_bonus_rules_window_chk",
      sql`${table.startsAt} IS NULL OR ${table.endsAt} IS NULL OR ${table.startsAt} <= ${table.endsAt}`,
    ),
  ],
);
