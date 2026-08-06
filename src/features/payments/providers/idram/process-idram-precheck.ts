import "server-only";

import { and, eq } from "drizzle-orm";

import { orderEvents, orderItems, orders, payments, products } from "@/db/schema";
import type { DatabaseTransaction } from "@/db/transaction";
import { withTransaction } from "@/db/transaction";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import {
  idramAmountMatchesLocal,
  parseIdramAmount,
} from "@/lib/payments/idram/amount";
import { requireIdramConfig } from "@/lib/payments/idram/config";
import { IdramAmountError } from "@/lib/payments/idram/errors";
import { redactBillNumber } from "@/lib/payments/idram/redaction";
import type { IdramPrecheckPayload } from "@/lib/payments/idram/schemas";
import {
  IDRAM_RESULT_FAIL_BODY,
  IDRAM_RESULT_OK_BODY,
} from "@/lib/payments/idram/types";
import { createId } from "@/lib/id";
import { logger } from "@/lib/observability/logger";

export type IdramResultBody =
  | typeof IDRAM_RESULT_OK_BODY
  | typeof IDRAM_RESULT_FAIL_BODY;

/**
 * Official precheck (§4a). Validates order authenticity; does not capture.
 * Returns exact "OK" or non-OK body.
 */
export async function processIdramPrecheck(
  payload: IdramPrecheckPayload,
): Promise<IdramResultBody> {
  const config = requireIdramConfig();

  if (payload.EDP_REC_ACCOUNT !== config.recAccount) {
    return IDRAM_RESULT_FAIL_BODY;
  }

  let parsedAmount: number;
  try {
    parsedAmount = parseIdramAmount(payload.EDP_AMOUNT);
  } catch (error) {
    if (error instanceof IdramAmountError) {
      return IDRAM_RESULT_FAIL_BODY;
    }
    throw error;
  }

  return withTransaction(async (tx) => {
    const [payment] = await tx
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

    if (!payment) {
      return IDRAM_RESULT_FAIL_BODY;
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .for("update")
      .limit(1);

    if (!order || order.status === "CANCELLED") {
      return IDRAM_RESULT_FAIL_BODY;
    }

    if (payment.status === "CAPTURED" || order.paymentStatus === "CAPTURED") {
      return IDRAM_RESULT_FAIL_BODY;
    }

    if (payment.status === "FAILED" || payment.status === "CANCELLED") {
      return IDRAM_RESULT_FAIL_BODY;
    }

    if (payment.expiresAt && payment.expiresAt.getTime() <= Date.now()) {
      return IDRAM_RESULT_FAIL_BODY;
    }

    if (
      parsedAmount !== payment.amount ||
      !idramAmountMatchesLocal(payload.EDP_AMOUNT, payment.amount)
    ) {
      await recordPrecheck(tx, payment, false, "AMOUNT_MISMATCH");
      return IDRAM_RESULT_FAIL_BODY;
    }

    if (payment.currency !== "AMD" || order.baseCurrency !== "AMD") {
      return IDRAM_RESULT_FAIL_BODY;
    }

    const stockOk = await isStockAvailable(tx, order.id);
    if (!stockOk) {
      await recordPrecheck(tx, payment, false, "STOCK_UNAVAILABLE");
      return IDRAM_RESULT_FAIL_BODY;
    }

    await recordPrecheck(tx, payment, true, "ACCEPTED");
    logger.info("idram.precheck_accepted", {
      provider: "idram",
      paymentId: payment.id,
      orderId: order.id,
      billNumber: redactBillNumber(payload.EDP_BILL_NO),
    });
    return IDRAM_RESULT_OK_BODY;
  });
}

async function isStockAvailable(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<boolean> {
  const lines = await tx
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const needed = new Map<string, number>();
  for (const line of lines) {
    if (!line.productId) continue;
    needed.set(
      line.productId,
      (needed.get(line.productId) ?? 0) + line.quantity,
    );
  }

  for (const [productId, qty] of needed) {
    const [row] = await tx
      .select({ stockOnHand: products.stockOnHand })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!row || row.stockOnHand < qty) {
      return false;
    }
  }
  return true;
}

async function recordPrecheck(
  tx: DatabaseTransaction,
  payment: typeof payments.$inferSelect,
  accepted: boolean,
  reason: string,
): Promise<void> {
  try {
    await tx.insert(orderEvents).values({
      id: createId(),
      orderId: payment.orderId,
      eventType: "PAYMENT_PROVIDER",
      fromState: payment.status,
      toState: payment.status,
      isCustomerVisible: false,
      provider: "idram",
      providerEventId: `idram:precheck:${payment.id}:${reason}:${Date.now()}`,
      payload: buildSafePaymentEventPayload({
        kind: accepted ? "IDRAM_PRECHECK_ACCEPTED" : "IDRAM_PRECHECK_REJECTED",
        provider: "idram",
        paymentId: payment.id,
        attemptNumber: payment.attemptNumber,
        status: payment.status,
        errorCode: accepted ? undefined : reason,
        verifiedAmount: payment.amount,
        verifiedCurrency: payment.currency,
      }),
    });
  } catch {
    // ignore unique/event failures
  }
}
