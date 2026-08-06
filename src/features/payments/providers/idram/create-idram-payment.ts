import "server-only";

import { eq } from "drizzle-orm";

import { orderEvents, orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  PaymentNotFoundError,
  PaymentProviderNotConfiguredError,
} from "@/features/payments/domain/errors";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import { buildIdramBillNumber } from "@/features/payments/providers/idram/bill-number";
import {
  isIdramPaymentUrlAllowed,
  requireIdramConfig,
} from "@/lib/payments/idram/config";
import { IdramFormUrlRejectedError } from "@/lib/payments/idram/errors";
import { buildIdramFormFields, mapLocaleToIdramLanguage } from "@/lib/payments/idram/form";
import {
  IDRAM_ATTEMPT_TTL_MS,
  type IdramPaymentFormPayload,
} from "@/lib/payments/idram/types";
import { createId } from "@/lib/id";
import { logger } from "@/lib/observability/logger";
import { redactBillNumber } from "@/lib/payments/idram/redaction";

/**
 * Ensures a PENDING iDram attempt has a stable bill number and returns the POST form.
 */
export async function createIdramPaymentForm(input: {
  paymentId: string;
  locale?: string;
}): Promise<IdramPaymentFormPayload> {
  let config;
  try {
    config = requireIdramConfig();
  } catch {
    throw new PaymentProviderNotConfiguredError("idram");
  }

  if (!isIdramPaymentUrlAllowed(config.paymentUrl, config.allowedPaymentHosts)) {
    throw new IdramFormUrlRejectedError();
  }

  return withTransaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, input.paymentId))
      .for("update")
      .limit(1);

    if (!payment || payment.provider !== "idram") {
      throw new PaymentNotFoundError();
    }
    if (payment.status !== "PENDING") {
      throw new PaymentNotFoundError();
    }
    if (payment.currency !== "AMD") {
      throw new PaymentNotFoundError();
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .for("update")
      .limit(1);

    if (!order || order.status === "CANCELLED") {
      throw new PaymentNotFoundError();
    }

    const billNo =
      payment.providerOrderNumber ??
      buildIdramBillNumber(payment.id, payment.attemptNumber);

    const now = new Date();
    const expiresAt =
      payment.expiresAt ?? new Date(now.getTime() + IDRAM_ATTEMPT_TTL_MS);

    if (!payment.providerOrderNumber || !payment.expiresAt) {
      await tx
        .update(payments)
        .set({
          providerOrderNumber: billNo,
          expiresAt,
          updatedAt: now,
        })
        .where(eq(payments.id, payment.id));

      await tx.insert(orderEvents).values({
        id: createId(),
        orderId: order.id,
        eventType: "PAYMENT_PROVIDER",
        fromState: "PENDING",
        toState: "PENDING",
        isCustomerVisible: false,
        provider: "idram",
        providerEventId: `idram:form:${billNo}`,
        payload: buildSafePaymentEventPayload({
          kind: "IDRAM_FORM_CREATED",
          provider: "idram",
          paymentId: payment.id,
          attemptNumber: payment.attemptNumber,
          status: "PENDING",
          verifiedAmount: payment.amount,
          verifiedCurrency: payment.currency,
        }),
      });
    }

    const fields = buildIdramFormFields({
      language: mapLocaleToIdramLanguage(input.locale ?? order.locale),
      recAccount: config.recAccount,
      description: `Order ${order.orderNumber}`,
      amountAmd: payment.amount,
      billNo,
      email: order.contactEmail || undefined,
      orderNumber: order.orderNumber,
      locale: input.locale ?? order.locale,
    });

    logger.info("idram.form_created", {
      provider: "idram",
      paymentId: payment.id,
      orderId: order.id,
      billNumber: redactBillNumber(billNo),
    });

    return {
      type: "payment_form_required",
      provider: "idram",
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      action: config.paymentUrl,
      method: "POST",
      fields,
    };
  });
}
