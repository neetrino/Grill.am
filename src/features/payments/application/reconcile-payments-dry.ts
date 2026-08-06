import "server-only";

import { and, asc, eq, inArray, isNotNull, lt, ne, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { carts, orders, outboxEvents, payments } from "@/db/schema";

export type ReconcileDryCategory =
  | "pending_beyond_threshold"
  | "failed_may_be_paid"
  | "authorized_stale"
  | "captured_cart_not_converted"
  | "requires_review"
  | "missing_capture_notification"
  | "outbox_permanently_failed";

export type ReconcileDryCandidate = {
  category: ReconcileDryCategory;
  orderNumber: string;
  provider: string;
  attemptNumber: number | null;
  paymentStatus: string | null;
  orderStatus: string | null;
  paymentId: string | null;
  ageMinutes: number | null;
  recommendedAction: string;
};

export type ReconcilePaymentsDryReport = {
  mode: "dry";
  generatedAt: string;
  pendingThresholdMinutes: number;
  counts: Record<ReconcileDryCategory, number>;
  candidates: ReconcileDryCandidate[];
  limitations: string[];
};

const DEFAULT_PENDING_THRESHOLD_MS = 60 * 60 * 1000;
const MAX_ROWS_PER_CATEGORY = 50;

function ageMinutes(from: Date, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - from.getTime()) / 60_000));
}

/**
 * Read-only payment attention report. Never mutates state or calls providers.
 */
export async function reconcilePaymentsDry(options?: {
  pendingThresholdMs?: number;
  now?: Date;
}): Promise<ReconcilePaymentsDryReport> {
  const now = options?.now ?? new Date();
  const pendingThresholdMs =
    options?.pendingThresholdMs ?? DEFAULT_PENDING_THRESHOLD_MS;
  const pendingCutoff = new Date(now.getTime() - pendingThresholdMs);
  const db = getDb();
  const candidates: ReconcileDryCandidate[] = [];

  const pendingRows = await db
    .select({
      paymentId: payments.id,
      orderNumber: orders.orderNumber,
      provider: payments.provider,
      attemptNumber: payments.attemptNumber,
      paymentStatus: payments.status,
      orderStatus: orders.status,
      createdAt: payments.createdAt,
      expiresAt: payments.expiresAt,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(
      and(
        eq(payments.status, "PENDING"),
        inArray(payments.provider, ["arca", "idram"]),
        or(
          and(isNotNull(payments.expiresAt), lt(payments.expiresAt, now)),
          lt(payments.createdAt, pendingCutoff),
        ),
      ),
    )
    .orderBy(asc(payments.createdAt))
    .limit(MAX_ROWS_PER_CATEGORY);

  for (const row of pendingRows) {
    candidates.push({
      category: "pending_beyond_threshold",
      orderNumber: row.orderNumber,
      provider: row.provider,
      attemptNumber: row.attemptNumber,
      paymentStatus: row.paymentStatus,
      orderStatus: row.orderStatus,
      paymentId: row.paymentId,
      ageMinutes: ageMinutes(row.createdAt, now),
      recommendedAction:
        row.provider === "arca"
          ? "Run ARCA status recheck / payments:arca:reconcile after enable; or mark expired if abandoned."
          : "Local audit only (no iDram status API). Confirm in merchant portal; expire/retry if abandoned.",
    });
  }

  const failedRows = await db
    .select({
      paymentId: payments.id,
      orderNumber: orders.orderNumber,
      provider: payments.provider,
      attemptNumber: payments.attemptNumber,
      paymentStatus: payments.status,
      orderStatus: orders.status,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(
      and(
        eq(payments.status, "FAILED"),
        inArray(payments.provider, ["arca", "idram"]),
        lt(payments.createdAt, pendingCutoff),
      ),
    )
    .orderBy(asc(payments.createdAt))
    .limit(MAX_ROWS_PER_CATEGORY);

  for (const row of failedRows) {
    candidates.push({
      category: "failed_may_be_paid",
      orderNumber: row.orderNumber,
      provider: row.provider,
      attemptNumber: row.attemptNumber,
      paymentStatus: row.paymentStatus,
      orderStatus: row.orderStatus,
      paymentId: row.paymentId,
      ageMinutes: ageMinutes(row.createdAt, now),
      recommendedAction:
        row.provider === "arca"
          ? "Verify provider status via getOrderStatusExtended before customer communication."
          : "Check iDram merchant portal; do not invent a status-query call.",
    });
  }

  const authorizedRows = await db
    .select({
      paymentId: payments.id,
      orderNumber: orders.orderNumber,
      provider: payments.provider,
      attemptNumber: payments.attemptNumber,
      paymentStatus: payments.status,
      orderStatus: orders.status,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(
      and(
        eq(payments.status, "AUTHORIZED"),
        eq(payments.provider, "arca"),
        lt(payments.createdAt, pendingCutoff),
      ),
    )
    .orderBy(asc(payments.createdAt))
    .limit(MAX_ROWS_PER_CATEGORY);

  for (const row of authorizedRows) {
    candidates.push({
      category: "authorized_stale",
      orderNumber: row.orderNumber,
      provider: row.provider,
      attemptNumber: row.attemptNumber,
      paymentStatus: row.paymentStatus,
      orderStatus: row.orderStatus,
      paymentId: row.paymentId,
      ageMinutes: ageMinutes(row.createdAt, now),
      recommendedAction:
        "Two-stage ARCA: recheck status; complete deposit only via approved merchant workflow.",
    });
  }

  const cartMismatch = await db
    .select({
      paymentId: payments.id,
      orderNumber: orders.orderNumber,
      provider: payments.provider,
      attemptNumber: payments.attemptNumber,
      paymentStatus: payments.status,
      orderStatus: orders.status,
      createdAt: payments.capturedAt,
      cartStatus: carts.status,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .leftJoin(carts, eq(carts.id, orders.sourceCartId))
    .where(
      and(
        eq(payments.status, "CAPTURED"),
        inArray(payments.provider, ["arca", "idram"]),
        or(sql`${orders.sourceCartId} IS NULL`, ne(carts.status, "CONVERTED")),
      ),
    )
    .orderBy(asc(payments.capturedAt))
    .limit(MAX_ROWS_PER_CATEGORY);

  for (const row of cartMismatch) {
    candidates.push({
      category: "captured_cart_not_converted",
      orderNumber: row.orderNumber,
      provider: row.provider,
      attemptNumber: row.attemptNumber,
      paymentStatus: row.paymentStatus,
      orderStatus: row.orderStatus,
      paymentId: row.paymentId,
      ageMinutes: row.createdAt ? ageMinutes(row.createdAt, now) : null,
      recommendedAction:
        "Investigate cart conversion side effects; do not re-capture. Prefer audit + manual ops.",
    });
  }

  const reviewRows = await db
    .select({
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      paymentStatus: orders.paymentStatus,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(eq(orders.status, "REQUIRES_REVIEW"))
    .orderBy(asc(orders.updatedAt))
    .limit(MAX_ROWS_PER_CATEGORY);

  for (const row of reviewRows) {
    candidates.push({
      category: "requires_review",
      orderNumber: row.orderNumber,
      provider: "n/a",
      attemptNumber: null,
      paymentStatus: row.paymentStatus,
      orderStatus: row.orderStatus,
      paymentId: null,
      ageMinutes: ageMinutes(row.updatedAt, now),
      recommendedAction:
        "Operator resolve via admin review workflow after fulfillment decision.",
    });
  }

  const capturedOnline = await db
    .select({
      paymentId: payments.id,
      orderNumber: orders.orderNumber,
      provider: payments.provider,
      attemptNumber: payments.attemptNumber,
      paymentStatus: payments.status,
      orderStatus: orders.status,
      capturedAt: payments.capturedAt,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(
      and(
        eq(payments.status, "CAPTURED"),
        inArray(payments.provider, ["arca", "idram"]),
      ),
    )
    .orderBy(asc(payments.capturedAt))
    .limit(200);

  if (capturedOnline.length > 0) {
    const expectedKeys = capturedOnline.map(
      (row) => `payment-captured:${row.paymentId}:customer`,
    );
    const existing = await db
      .select({ dedupeKey: outboxEvents.dedupeKey })
      .from(outboxEvents)
      .where(inArray(outboxEvents.dedupeKey, expectedKeys));
    const present = new Set(
      existing.map((row) => row.dedupeKey).filter((key): key is string => Boolean(key)),
    );

    for (const row of capturedOnline) {
      const key = `payment-captured:${row.paymentId}:customer`;
      if (present.has(key)) continue;
      candidates.push({
        category: "missing_capture_notification",
        orderNumber: row.orderNumber,
        provider: row.provider,
        attemptNumber: row.attemptNumber,
        paymentStatus: row.paymentStatus,
        orderStatus: row.orderStatus,
        paymentId: row.paymentId,
        ageMinutes: row.capturedAt ? ageMinutes(row.capturedAt, now) : null,
        recommendedAction:
          "Enqueue/retry customer capture notification via outbox; verify dedupe key.",
      });
      if (
        candidates.filter((c) => c.category === "missing_capture_notification")
          .length >= MAX_ROWS_PER_CATEGORY
      ) {
        break;
      }
    }
  }

  const failedOutbox = await db
    .select({
      aggregateId: outboxEvents.aggregateId,
      eventType: outboxEvents.eventType,
      failedAt: outboxEvents.failedAt,
      lastErrorCode: outboxEvents.lastErrorCode,
    })
    .from(outboxEvents)
    .where(eq(outboxEvents.status, "FAILED"))
    .orderBy(asc(outboxEvents.failedAt))
    .limit(MAX_ROWS_PER_CATEGORY);

  for (const row of failedOutbox) {
    candidates.push({
      category: "outbox_permanently_failed",
      orderNumber: row.aggregateId,
      provider: "outbox",
      attemptNumber: null,
      paymentStatus: null,
      orderStatus: null,
      paymentId: null,
      ageMinutes: row.failedAt ? ageMinutes(row.failedAt, now) : null,
      recommendedAction: `Inspect outbox ${row.eventType} (errorCode=${row.lastErrorCode ?? "n/a"}); fix transport then re-enqueue with same dedupe.`,
    });
  }

  const counts = {
    pending_beyond_threshold: 0,
    failed_may_be_paid: 0,
    authorized_stale: 0,
    captured_cart_not_converted: 0,
    requires_review: 0,
    missing_capture_notification: 0,
    outbox_permanently_failed: 0,
  } satisfies Record<ReconcileDryCategory, number>;

  for (const row of candidates) {
    counts[row.category] += 1;
  }

  return {
    mode: "dry",
    generatedAt: now.toISOString(),
    pendingThresholdMinutes: Math.round(pendingThresholdMs / 60_000),
    counts,
    candidates,
    limitations: [
      "Never mutates payment/order/outbox state.",
      "Does not call ARCA or iDram APIs.",
      "Cannot prove 'provider paid but local not CAPTURED' without provider query or portal.",
      "Provider reference collisions are prevented by DB unique constraints; not listed here.",
      "Stock-decrement verification beyond cart conversion is not included in this dry report.",
    ],
  };
}
