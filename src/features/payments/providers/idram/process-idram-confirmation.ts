import "server-only";

import { and, eq } from "drizzle-orm";

import { orderEvents, orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { confirmPayment } from "@/features/payments/application/confirm-payment";
import { scheduleOrderEmails } from "@/features/notifications/application/schedule-order-emails";
import {
  InsufficientStockAtConfirmationError,
  isPaymentDomainError,
} from "@/features/payments/domain/errors";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import { paymentLifecycleTimestampPatch } from "@/features/payments/domain/payment-lifecycle-timestamps";
import { canProviderTransitionPaymentStatus } from "@/features/payments/domain/provider-payment-transitions";
import {
  PAYMENT_METRIC_NAMES,
  paymentMetrics,
} from "@/features/payments/domain/payment-metrics";
import {
  idramAmountMatchesLocal,
  parseIdramAmount,
} from "@/lib/payments/idram/amount";
import { verifyIdramChecksum } from "@/lib/payments/idram/checksum";
import { requireIdramConfig } from "@/lib/payments/idram/config";
import { IdramAmountError, IdramChecksumError } from "@/lib/payments/idram/errors";
import { redactBillNumber, redactTransId } from "@/lib/payments/idram/redaction";
import type { IdramConfirmationPayload } from "@/lib/payments/idram/schemas";
import {
  IDRAM_RESULT_FAIL_BODY,
  IDRAM_RESULT_OK_BODY,
  type IdramResultBody,
} from "@/lib/payments/idram/types";
import { createId } from "@/lib/id";
import { logger } from "@/lib/observability/logger";

/**
 * Official payment confirmation (§4b). Authoritative capture path.
 */
export async function processIdramConfirmation(
  payload: IdramConfirmationPayload,
): Promise<IdramResultBody> {
  const config = requireIdramConfig();

  if (payload.EDP_REC_ACCOUNT !== config.recAccount) {
    return IDRAM_RESULT_FAIL_BODY;
  }

  let amountAmd: number;
  try {
    amountAmd = parseIdramAmount(payload.EDP_AMOUNT);
  } catch (error) {
    if (error instanceof IdramAmountError) {
      return IDRAM_RESULT_FAIL_BODY;
    }
    throw error;
  }

  let checksumOk = false;
  try {
    checksumOk = verifyIdramChecksum(payload.EDP_CHECKSUM, {
      edpRecAccount: payload.EDP_REC_ACCOUNT,
      edpAmount: payload.EDP_AMOUNT,
      secretKey: config.secretKey,
      edpBillNo: payload.EDP_BILL_NO,
      edpPayerAccount: payload.EDP_PAYER_ACCOUNT,
      edpTransId: payload.EDP_TRANS_ID,
      edpTransDate: payload.EDP_TRANS_DATE,
    });
  } catch (error) {
    if (error instanceof IdramChecksumError) {
      await recordSecurityEvent(payload, "CHECKSUM_FORMAT");
      return IDRAM_RESULT_FAIL_BODY;
    }
    throw error;
  }

  if (!checksumOk) {
    await recordSecurityEvent(payload, "CHECKSUM_INVALID");
    logger.warn("idram.checksum_invalid", {
      provider: "idram",
      billNumber: redactBillNumber(payload.EDP_BILL_NO),
      transId: redactTransId(payload.EDP_TRANS_ID),
    });
    return IDRAM_RESULT_FAIL_BODY;
  }

  const payment = await withTransaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.provider, "idram"),
          eq(payments.providerOrderNumber, payload.EDP_BILL_NO),
        ),
      )
      .for("update")
      .limit(1);
    return row ?? null;
  });

  if (!payment) {
    return IDRAM_RESULT_FAIL_BODY;
  }

  if (
    amountAmd !== payment.amount ||
    !idramAmountMatchesLocal(payload.EDP_AMOUNT, payment.amount)
  ) {
    await recordSecurityEvent(payload, "AMOUNT_MISMATCH", payment.id, payment.orderId);
    return IDRAM_RESULT_FAIL_BODY;
  }

  if (
    payment.providerReference &&
    payment.providerReference !== payload.EDP_TRANS_ID
  ) {
    await recordSecurityEvent(payload, "TRANS_ID_CONFLICT", payment.id, payment.orderId);
    return IDRAM_RESULT_FAIL_BODY;
  }

  const providerEventId = `idram:confirm:${payload.EDP_TRANS_ID}`;

  try {
    const result = await confirmPayment({
      paymentId: payment.id,
      providerReference: payload.EDP_TRANS_ID,
      providerEventId,
      verifiedAmount: payment.amount,
      verifiedCurrency: payment.currency,
      safeMetadata: {
        idramTransDate: payload.EDP_TRANS_DATE,
        idramBillNo: payload.EDP_BILL_NO,
      },
    });

    logger.info("idram.confirmation_processed", {
      provider: "idram",
      paymentId: payment.id,
      orderId: payment.orderId,
      outcome: result.type,
      billNumber: redactBillNumber(payload.EDP_BILL_NO),
      transId: redactTransId(payload.EDP_TRANS_ID),
    });

    // Always OK once provider confirmation is valid — stops iDram retries.
    return IDRAM_RESULT_OK_BODY;
  } catch (error) {
    if (error instanceof InsufficientStockAtConfirmationError) {
      await captureWithReview(payment, payload, providerEventId);
      return IDRAM_RESULT_OK_BODY;
    }
    if (isPaymentDomainError(error) && error.code === "PAYMENT_ALREADY_CAPTURED") {
      return IDRAM_RESULT_OK_BODY;
    }
    // Idempotent replay of already captured via confirmPayment already_processed
    // is returned as success above. Other domain errors → fail body.
    if (isPaymentDomainError(error)) {
      // If already CAPTURED from a previous identical confirm, treat as OK.
      const again = await withTransaction(async (tx) => {
        const [row] = await tx
          .select({ status: payments.status })
          .from(payments)
          .where(eq(payments.id, payment.id))
          .limit(1);
        return row?.status;
      });
      if (again === "CAPTURED") {
        return IDRAM_RESULT_OK_BODY;
      }
      logger.warn("idram.confirmation_rejected", {
        provider: "idram",
        paymentId: payment.id,
        errorCode: error.code,
      });
      return IDRAM_RESULT_FAIL_BODY;
    }
    throw error;
  }
}

async function captureWithReview(
  payment: typeof payments.$inferSelect,
  payload: IdramConfirmationPayload,
  providerEventId: string,
): Promise<void> {
  const notify = await withTransaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, payment.id))
      .for("update")
      .limit(1);
    if (!locked) return null;

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, locked.orderId))
      .for("update")
      .limit(1);
    if (!order) return null;

    if (locked.status === "CAPTURED") {
      return null;
    }
    if (!canProviderTransitionPaymentStatus(locked.status, "CAPTURED")) {
      return null;
    }

    const now = new Date();
    await tx
      .update(payments)
      .set({
        status: "CAPTURED",
        providerReference: payload.EDP_TRANS_ID,
        updatedAt: now,
        ...paymentLifecycleTimestampPatch("CAPTURED", now, locked),
      })
      .where(eq(payments.id, locked.id));

    await tx
      .update(orders)
      .set({
        paymentStatus: "CAPTURED",
        status: "REQUIRES_REVIEW",
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    await tx.insert(orderEvents).values({
      id: createId(),
      orderId: order.id,
      eventType: "PAYMENT_PROVIDER",
      fromState: locked.status,
      toState: "CAPTURED",
      isCustomerVisible: true,
      provider: "idram",
      providerEventId: `${providerEventId}:stock-review`,
      payload: buildSafePaymentEventPayload({
        kind: "PROVIDER_PAID_STOCK_UNAVAILABLE",
        provider: "idram",
        paymentId: locked.id,
        attemptNumber: locked.attemptNumber,
        providerReference: payload.EDP_TRANS_ID,
        status: "CAPTURED",
        verifiedAmount: locked.amount,
        verifiedCurrency: locked.currency,
        errorCode: "INSUFFICIENT_STOCK_AT_CONFIRMATION",
      }),
    });

    paymentMetrics.increment(PAYMENT_METRIC_NAMES.requiresReview, {
      provider: "idram",
      operation: "confirm_review",
      resultClass: "requires_review",
    });

    logger.error("idram.provider_paid_stock_unavailable", {
      provider: "idram",
      paymentId: locked.id,
      orderId: order.id,
      severity: "high",
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      locale: order.locale,
      paymentId: locked.id,
    };
  });

  if (notify) {
    scheduleOrderEmails({
      kind: "requires_review",
      orderId: notify.orderId,
      orderNumber: notify.orderNumber,
      locale: notify.locale,
      paymentId: notify.paymentId,
    });
  }
}

async function recordSecurityEvent(
  payload: IdramConfirmationPayload,
  reason: string,
  paymentId?: string,
  orderId?: string,
): Promise<void> {
  if (!orderId || !paymentId) return;
  try {
    await withTransaction(async (tx) => {
      await tx.insert(orderEvents).values({
        id: createId(),
        orderId,
        eventType: "PAYMENT_PROVIDER",
        fromState: null,
        toState: null,
        isCustomerVisible: false,
        provider: "idram",
        providerEventId: `idram:security:${payload.EDP_TRANS_ID}:${reason}`,
        payload: buildSafePaymentEventPayload({
          kind:
            reason === "CHECKSUM_INVALID" || reason === "CHECKSUM_FORMAT"
              ? "IDRAM_CHECKSUM_INVALID"
              : "IDRAM_RESULT_MISMATCH",
          provider: "idram",
          paymentId,
          attemptNumber: 0,
          status: "PENDING",
          errorCode: reason,
        }),
      });
    });
  } catch {
    // ignore
  }
}
