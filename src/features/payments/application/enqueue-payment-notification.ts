import { and, eq } from "drizzle-orm";

import type { DatabaseTransaction } from "@/db/transaction";
import { outboxEvents } from "@/db/schema";
import { createId } from "@/lib/id";
import { isUniqueViolation } from "@/features/payments/domain/postgres-errors";

export const PAYMENT_NOTIFICATION_TYPES = [
  "COD_ORDER_CREATED",
  "ONLINE_PAYMENT_CAPTURED",
  "ONLINE_PAYMENT_FAILED",
  "ONLINE_PAYMENT_CANCELLED",
  "PAYMENT_REQUIRES_REVIEW_CUSTOMER",
  "PAYMENT_REQUIRES_REVIEW_OPERATOR",
  "PAYMENT_PENDING_STALE_OPERATOR",
  "ADMIN_ORDER_NOTIFY",
] as const;

export type PaymentNotificationType =
  (typeof PAYMENT_NOTIFICATION_TYPES)[number];

export type EnqueuePaymentNotificationInput = {
  type: PaymentNotificationType;
  orderId: string;
  orderNumber: string;
  locale: string;
  /** Unique per logical notification; duplicate inserts are skipped. */
  dedupeKey: string;
  recipientRole: "customer" | "operator";
  safePayload?: Record<string, unknown>;
};

/**
 * Enqueues a durable payment notification into `outbox_events`.
 * Dedupe is enforced by UNIQUE(dedupe_key) plus application pre-check.
 */
export async function enqueuePaymentNotification(
  tx: DatabaseTransaction,
  input: EnqueuePaymentNotificationInput,
): Promise<{ enqueued: boolean; outboxId: string | null }> {
  const [existing] = await tx
    .select({ id: outboxEvents.id })
    .from(outboxEvents)
    .where(eq(outboxEvents.dedupeKey, input.dedupeKey))
    .limit(1);

  if (existing) {
    return { enqueued: false, outboxId: existing.id };
  }

  const id = createId();
  try {
    await tx.insert(outboxEvents).values({
      id,
      eventType: input.type,
      aggregateType: "order",
      aggregateId: input.orderId,
      dedupeKey: input.dedupeKey,
      payload: {
        dedupeKey: input.dedupeKey,
        orderNumber: input.orderNumber,
        locale: input.locale,
        recipientRole: input.recipientRole,
        ...(input.safePayload ?? {}),
      },
      payloadVersion: 1,
      status: "PENDING",
      maxAttempts: 8,
    });
    return { enqueued: true, outboxId: id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      const [race] = await tx
        .select({ id: outboxEvents.id })
        .from(outboxEvents)
        .where(
          and(
            eq(outboxEvents.dedupeKey, input.dedupeKey),
          ),
        )
        .limit(1);
      return { enqueued: false, outboxId: race?.id ?? null };
    }
    throw error;
  }
}
