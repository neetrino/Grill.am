import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
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
import { outboxStatusEnum } from "@/db/schema/enums";
import { users } from "@/db/schema/identity";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: idColumn(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    beforeDiff: jsonb("before_diff").$type<Record<string, unknown>>(),
    afterDiff: jsonb("after_diff").$type<Record<string, unknown>>(),
    requestId: text("request_id"),
    correlationId: text("correlation_id"),
    context: jsonb("context").$type<Record<string, unknown>>(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("audit_logs_actor_created_idx").on(table.actorUserId, table.createdAt),
    index("audit_logs_target_created_idx").on(
      table.targetType,
      table.targetId,
      table.createdAt,
    ),
  ],
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: idColumn(),
    eventType: text("event_type").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    payloadVersion: integer("payload_version").notNull().default(1),
    status: outboxStatusEnum("status").notNull().default("PENDING"),
    attemptCount: integer("attempt_count").notNull().default(0),
    availableAt: timestamp("available_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .default(sql`now()`),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      mode: "date",
    }),
    lastError: text("last_error"),
    /** Deterministic unique key for idempotent enqueue (nullable for legacy). */
    dedupeKey: text("dedupe_key"),
    claimedAt: timestamp("claimed_at", {
      withTimezone: true,
      mode: "date",
    }),
    claimedBy: text("claimed_by"),
    maxAttempts: integer("max_attempts").notNull().default(8),
    sentAt: timestamp("sent_at", {
      withTimezone: true,
      mode: "date",
    }),
    failedAt: timestamp("failed_at", {
      withTimezone: true,
      mode: "date",
    }),
    lastErrorCode: text("last_error_code"),
    providerMessageId: text("provider_message_id"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("outbox_events_status_available_idx").on(
      table.status,
      table.availableAt,
    ),
    index("outbox_events_aggregate_idx").on(
      table.aggregateType,
      table.aggregateId,
    ),
    uniqueIndex("outbox_events_dedupe_key_uidx")
      .on(table.dedupeKey)
      .where(sql`${table.dedupeKey} IS NOT NULL AND ${table.dedupeKey} <> ''`),
    index("outbox_events_claim_idx").on(table.status, table.availableAt),
    index("outbox_events_processing_claimed_idx")
      .on(table.status, table.claimedAt)
      .where(sql`${table.status} = 'PROCESSING'`),
  ],
);
