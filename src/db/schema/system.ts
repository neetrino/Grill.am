import {
  index,
  jsonb,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import {
  createdAtColumn,
  idColumn,
} from "@/db/schema/columns";
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
