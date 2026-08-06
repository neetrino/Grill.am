import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orderEvents, orders, payments } from "@/db/schema";
import { logger } from "@/lib/observability/logger";

/**
 * Operator audit for iDram pending / review / security signals.
 * Official Merchant API documents no server-side payment status query —
 * this does not call iDram; it only reports local DB state.
 */
async function main(): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);

  const pending = await db
    .select({
      paymentId: payments.id,
      orderId: payments.orderId,
      orderNumber: orders.orderNumber,
      attemptNumber: payments.attemptNumber,
      amount: payments.amount,
      expiresAt: payments.expiresAt,
      createdAt: payments.createdAt,
      providerOrderNumber: payments.providerOrderNumber,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(
      and(eq(payments.provider, "idram"), eq(payments.status, "PENDING")),
    )
    .limit(200);

  const stalePending = pending.filter(
    (row) =>
      (row.expiresAt != null && row.expiresAt.getTime() <= Date.now()) ||
      row.createdAt.getTime() < cutoff.getTime(),
  );

  const reviewOrders = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      paymentStatus: orders.paymentStatus,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(eq(orders.status, "REQUIRES_REVIEW"))
    .limit(100);

  const securityEvents = await db
    .select({
      orderId: orderEvents.orderId,
      providerEventId: orderEvents.providerEventId,
      createdAt: orderEvents.createdAt,
      payload: orderEvents.payload,
    })
    .from(orderEvents)
    .where(
      and(
        eq(orderEvents.provider, "idram"),
        sql`(${orderEvents.payload}->>'kind') in ('IDRAM_CHECKSUM_INVALID','IDRAM_RESULT_MISMATCH')`,
      ),
    )
    .orderBy(desc(orderEvents.createdAt))
    .limit(100);

  const summary = {
    provider: "idram",
    mode: "local_audit_only",
    note: "No official iDram status-query API is documented; use RESULT_URL confirmations and merchant portal for provider truth.",
    pendingCount: pending.length,
    stalePendingCount: stalePending.length,
    requiresReviewCount: reviewOrders.length,
    securityEventSampleCount: securityEvents.length,
    pendingSample: pending.slice(0, 20).map((row) => ({
      paymentId: row.paymentId,
      orderNumber: row.orderNumber,
      attemptNumber: row.attemptNumber,
      amount: row.amount,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      billNoPresent: Boolean(row.providerOrderNumber),
    })),
    reviewSample: reviewOrders.slice(0, 20).map((row) => ({
      orderNumber: row.orderNumber,
      paymentStatus: row.paymentStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    securitySample: securityEvents.slice(0, 20).map((row) => ({
      orderId: row.orderId,
      providerEventId: row.providerEventId,
      createdAt: row.createdAt.toISOString(),
      kind:
        row.payload &&
        typeof row.payload === "object" &&
        "kind" in row.payload
          ? String((row.payload as { kind: unknown }).kind)
          : null,
    })),
  };

  logger.info("idram.audit_pending.summary", {
    provider: "idram",
    pendingCount: summary.pendingCount,
    stalePendingCount: summary.stalePendingCount,
    requiresReviewCount: summary.requiresReviewCount,
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error: unknown) => {
  logger.error("idram.audit_pending.fatal", {
    provider: "idram",
    errorCode: error instanceof Error ? error.name : "UNKNOWN",
  });
  process.exitCode = 1;
});
