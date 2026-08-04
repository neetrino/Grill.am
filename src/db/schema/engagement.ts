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

import { products } from "@/db/schema/catalog";
import {
  createdAtColumn,
  idColumn,
  updatedAtColumn,
} from "@/db/schema/columns";
import { jobPostings } from "@/db/schema/content";
import {
  contactMessageStatusEnum,
  jobApplicationStatusEnum,
  reviewModerationStatusEnum,
} from "@/db/schema/enums";
import { users } from "@/db/schema/identity";
import { orderItems } from "@/db/schema/orders";

export const reviews = pgTable(
  "reviews",
  {
    id: idColumn(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    orderItemId: uuid("order_item_id").references(() => orderItems.id, {
      onDelete: "restrict",
    }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    moderationStatus: reviewModerationStatusEnum("moderation_status")
      .notNull()
      .default("PENDING"),
    moderatedByUserId: uuid("moderated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    moderatedAt: timestamp("moderated_at", {
      withTimezone: true,
      mode: "date",
    }),
    moderationReason: text("moderation_reason"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("reviews_user_product_uidx").on(table.userId, table.productId),
    index("reviews_product_status_created_idx").on(
      table.productId,
      table.moderationStatus,
      table.createdAt,
    ),
    check("reviews_rating_chk", sql`${table.rating} BETWEEN 1 AND 5`),
  ],
);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: idColumn(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: contactMessageStatusEnum("status").notNull().default("UNREAD"),
    spamScore: integer("spam_score"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("contact_messages_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const jobApplications = pgTable(
  "job_applications",
  {
    id: idColumn(),
    jobPostingId: uuid("job_posting_id")
      .notNull()
      .references(() => jobPostings.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    message: text("message").notNull(),
    status: jobApplicationStatusEnum("status").notNull().default("UNREAD"),
    cvObjectKey: text("cv_object_key").notNull(),
    cvFileName: text("cv_file_name").notNull(),
    cvMimeType: text("cv_mime_type").notNull(),
    cvByteSize: integer("cv_byte_size").notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("job_applications_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("job_applications_job_posting_idx").on(table.jobPostingId),
    check("job_applications_cv_byte_size_chk", sql`${table.cvByteSize} >= 0`),
  ],
);
