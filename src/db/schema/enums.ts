import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "OPERATOR",
  "CUSTOMER",
]);

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "SUSPENDED",
  "ANONYMIZED",
]);

export const productStatusEnum = pgEnum("product_status", [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
]);

export const categoryStatusEnum = pgEnum("category_status", [
  "ACTIVE",
  "ARCHIVED",
]);

/** Shared paid additions and free removals reusable across products. */
export const modifierKindEnum = pgEnum("modifier_kind", [
  "ADDON",
  "EXCLUSION",
]);

export const mediaUploadStatusEnum = pgEnum("media_upload_status", [
  "PENDING",
  "READY",
  "FAILED",
]);

export const mediaRoleEnum = pgEnum("media_role", [
  "GALLERY",
  "PRIMARY",
  "COVER",
  "HERO_DESKTOP",
  "HERO_MOBILE",
  "BRANDING",
]);

export const stockMovementReasonEnum = pgEnum("stock_movement_reason", [
  "ORDER",
  "CANCEL",
  "RETURN",
  "ADMIN_ADJUSTMENT",
  "IMPORT",
]);

export const blogPostStatusEnum = pgEnum("blog_post_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const jobPostingStatusEnum = pgEnum("job_posting_status", [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
]);

export const jobEmploymentTypeEnum = pgEnum("job_employment_type", [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
]);

export const cartStatusEnum = pgEnum("cart_status", [
  "ACTIVE",
  "MERGED",
  "CONVERTED",
  "ABANDONED",
]);

export const promotionKindEnum = pgEnum("promotion_kind", [
  "COUPON",
  "AUTOMATIC",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "PERCENTAGE",
  "FIXED",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "REQUIRES_REVIEW",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "AUTHORIZED",
  "CAPTURED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
]);

export const orderEventTypeEnum = pgEnum("order_event_type", [
  "STATUS_CHANGE",
  "NOTE",
  "PAYMENT_PROVIDER",
]);

export const reviewModerationStatusEnum = pgEnum("review_moderation_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const contactMessageStatusEnum = pgEnum("contact_message_status", [
  "UNREAD",
  "READ",
  "REPLIED",
  "ARCHIVED",
]);

export const jobApplicationStatusEnum = pgEnum("job_application_status", [
  "UNREAD",
  "READ",
  "ARCHIVED",
]);
