import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { products } from "@/db/schema/catalog";
import {
  createdAtColumn,
  idColumn,
  updatedAtColumn,
} from "@/db/schema/columns";
import { cartStatusEnum } from "@/db/schema/enums";
import { users } from "@/db/schema/identity";

/** Selected option/addon/exclusion ids for a cart line. */
export type CartItemModifiersJson = {
  optionChoices: Record<string, string>;
  addonIds: string[];
  exclusionIds: string[];
};

export const carts = pgTable(
  "carts",
  {
    id: idColumn(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    guestTokenHash: text("guest_token_hash"),
    status: cartStatusEnum("status").notNull().default("ACTIVE"),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("carts_active_user_uidx")
      .on(table.userId)
      .where(sql`${table.status} = 'ACTIVE' AND ${table.userId} IS NOT NULL`),
    uniqueIndex("carts_active_guest_uidx")
      .on(table.guestTokenHash)
      .where(
        sql`${table.status} = 'ACTIVE' AND ${table.guestTokenHash} IS NOT NULL`,
      ),
    index("carts_status_idx").on(table.status),
    check(
      "carts_owner_chk",
      sql`(
        (${table.userId} IS NOT NULL AND ${table.guestTokenHash} IS NULL)
        OR (${table.userId} IS NULL AND ${table.guestTokenHash} IS NOT NULL)
      )`,
    ),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: idColumn(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    /** Canonical JSON of selected options/addons/exclusions. */
    modifiers: jsonb("modifiers")
      .$type<CartItemModifiersJson>()
      .notNull()
      .default({
        optionChoices: {},
        addonIds: [],
        exclusionIds: [],
      }),
    /**
     * Stable identity for merge — empty string means no customization.
     * Unique with (cart_id, product_id) so identical configs merge quantity.
     */
    selectionKey: text("selection_key").notNull().default(""),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("cart_items_cart_product_selection_uidx").on(
      table.cartId,
      table.productId,
      table.selectionKey,
    ),
    check("cart_items_qty_chk", sql`${table.quantity} > 0`),
  ],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: idColumn(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("wishlist_items_user_product_uidx").on(
      table.userId,
      table.productId,
    ),
  ],
);
