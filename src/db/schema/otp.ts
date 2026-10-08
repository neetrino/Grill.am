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

import { createdAtColumn, idColumn } from "@/db/schema/columns";
import { phoneOtpPurposeEnum } from "@/db/schema/enums";
import { users } from "@/db/schema/identity";

/**
 * Single-use SMS OTP challenges.
 * `code_hash` is HMAC-SHA256; the plaintext code is never stored.
 */
export const phoneOtpChallenges = pgTable(
  "phone_otp_challenges",
  {
    id: idColumn(),
    /** Canonical E.164 phone number. */
    phone: text("phone").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    purpose: phoneOtpPurposeEnum("purpose").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    consumedAt: timestamp("consumed_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("phone_otp_challenges_phone_purpose_created_idx").on(
      table.phone,
      table.purpose,
      table.createdAt,
    ),
    index("phone_otp_challenges_user_idx").on(table.userId),
    uniqueIndex("phone_otp_challenges_one_active_uidx")
      .on(table.phone, table.purpose)
      .where(sql`${table.consumedAt} IS NULL`),
    check(
      "phone_otp_challenges_attempts_nonneg_chk",
      sql`${table.attempts} >= 0`,
    ),
    check(
      "phone_otp_challenges_max_attempts_pos_chk",
      sql`${table.maxAttempts} > 0`,
    ),
  ],
);
