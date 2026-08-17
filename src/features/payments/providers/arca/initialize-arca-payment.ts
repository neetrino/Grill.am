import "server-only";

import { eq } from "drizzle-orm";

import { orderEvents, orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { getArcaPendingTimeoutMs } from "@/features/payments/application/payment-job-config";
import {
  PaymentNotFoundError,
  PaymentProviderNotConfiguredError,
} from "@/features/payments/domain/errors";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import { buildArcaLocalOrderNumber } from "@/features/payments/providers/arca/local-order-number";
import {
  mergeArcaPaymentMetadata,
  readArcaPaymentMetadata,
  type ArcaPaymentMetadata,
} from "@/features/payments/providers/arca/metadata";
import { toArcaAmountMinorUnits } from "@/lib/payments/arca/amount";
import { createArcaPaymentClient } from "@/lib/payments/arca/client";
import {
  isFormUrlHostAllowed,
  requireArcaConfig,
} from "@/lib/payments/arca/config";
import {
  ArcaBusinessError,
  ArcaFormUrlRejectedError,
  ArcaHttpError,
  ArcaTimeoutError,
  isArcaProtocolError,
} from "@/lib/payments/arca/errors";
import { logger } from "@/lib/observability/logger";
import { redactProviderReference } from "@/lib/payments/arca/redaction";
import { createId } from "@/lib/id";

export type InitializeArcaPaymentResult =
  | {
      type: "redirect";
      paymentId: string;
      orderId: string;
      orderNumber: string;
      redirectUrl: string;
      providerReference: string;
    }
  | {
      type: "uncertain";
      paymentId: string;
      orderId: string;
      orderNumber: string;
    };

type PreparedAttempt = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  attemptNumber: number;
  amount: number;
  currency: string;
  localOrderNumber: string;
  providerReference: string | null;
  formUrl: string | null;
  initializationState: string | null;
};

async function loadPreparedAttempt(
  paymentId: string,
): Promise<PreparedAttempt> {
  return withTransaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .for("update")
      .limit(1);

    if (!payment || payment.provider !== "arca") {
      throw new PaymentNotFoundError();
    }
    if (payment.status !== "PENDING") {
      throw new PaymentNotFoundError();
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .for("update")
      .limit(1);

    if (!order) {
      throw new PaymentNotFoundError();
    }

    const meta = readArcaPaymentMetadata(payment.metadata);
    const localOrderNumber =
      meta.arca?.localOrderNumber ??
      buildArcaLocalOrderNumber(payment.id, payment.attemptNumber);

    if (!meta.arca?.localOrderNumber) {
      await tx
        .update(payments)
        .set({
          metadata: mergeArcaPaymentMetadata(payment.metadata, {
            localOrderNumber,
            initializationState:
              meta.arca?.initializationState ?? "pending_register",
          }),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
    }

    return {
      paymentId: payment.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      attemptNumber: payment.attemptNumber,
      amount: payment.amount,
      currency: payment.currency,
      localOrderNumber,
      providerReference: payment.providerReference,
      formUrl: meta.arca?.formUrl ?? null,
      initializationState: meta.arca?.initializationState ?? null,
    };
  });
}

/**
 * Registers (or safely reuses) an ARCA payment for a PENDING attempt.
 * HTTP calls run outside the DB lock; persistence is re-checked under lock.
 */
export async function initializeArcaPayment(input: {
  paymentId: string;
  locale?: string;
}): Promise<InitializeArcaPaymentResult> {
  let config;
  try {
    config = requireArcaConfig();
  } catch {
    throw new PaymentProviderNotConfiguredError("arca");
  }

  const prepared = await loadPreparedAttempt(input.paymentId);
  const client = createArcaPaymentClient(config);

  if (
    prepared.providerReference &&
    prepared.formUrl &&
    prepared.initializationState === "registered" &&
    isFormUrlHostAllowed(prepared.formUrl, config.allowedFormHosts)
  ) {
    return {
      type: "redirect",
      paymentId: prepared.paymentId,
      orderId: prepared.orderId,
      orderNumber: prepared.orderNumber,
      redirectUrl: prepared.formUrl,
      providerReference: prepared.providerReference,
    };
  }

  if (prepared.initializationState === "uncertain") {
    try {
      const status = await client.getOrderStatusExtended({
        orderNumber: prepared.localOrderNumber,
        language: input.locale ?? config.language,
      });
      const recoveredId =
        status.attributes?.find((a) => a.name === "mdOrder")?.value ??
        prepared.providerReference;

      if (recoveredId && prepared.formUrl) {
        await persistRegistration({
          paymentId: prepared.paymentId,
          orderId: prepared.orderId,
          attemptNumber: prepared.attemptNumber,
          localOrderNumber: prepared.localOrderNumber,
          providerOrderId: recoveredId,
          formUrl: prepared.formUrl,
          eventKind: "ARCA_REGISTER_RECOVERED",
        });
        return {
          type: "redirect",
          paymentId: prepared.paymentId,
          orderId: prepared.orderId,
          orderNumber: prepared.orderNumber,
          redirectUrl: prepared.formUrl,
          providerReference: recoveredId,
        };
      }
    } catch {
      // keep uncertain
    }
    return {
      type: "uncertain",
      paymentId: prepared.paymentId,
      orderId: prepared.orderId,
      orderNumber: prepared.orderNumber,
    };
  }

  const returnUrl = new URL(
    "/api/v1/payments/arca/return",
    config.returnBaseUrl,
  );
  returnUrl.searchParams.set("pid", prepared.paymentId);
  if (input.locale) {
    returnUrl.searchParams.set("locale", input.locale);
  }

  const amountMinor = toArcaAmountMinorUnits(
    prepared.amount,
    prepared.currency,
  );

  try {
    const registered = await client.register({
      orderNumber: prepared.localOrderNumber,
      amountMinorUnits: amountMinor,
      currencyCode: config.currencyCode,
      returnUrl: returnUrl.toString(),
      language: input.locale ?? config.language,
      description: `Order ${prepared.orderNumber}`,
      pageView: "DESKTOP",
    });

    await persistRegistration({
      paymentId: prepared.paymentId,
      orderId: prepared.orderId,
      attemptNumber: prepared.attemptNumber,
      localOrderNumber: prepared.localOrderNumber,
      providerOrderId: registered.providerOrderId,
      formUrl: registered.formUrl,
      eventKind: "ARCA_REGISTERED",
    });

    logger.info("arca.registered", {
      provider: "arca",
      paymentId: prepared.paymentId,
      orderId: prepared.orderId,
      providerReference: redactProviderReference(registered.providerOrderId),
    });

    return {
      type: "redirect",
      paymentId: prepared.paymentId,
      orderId: prepared.orderId,
      orderNumber: prepared.orderNumber,
      redirectUrl: registered.formUrl,
      providerReference: registered.providerOrderId,
    };
  } catch (error) {
    if (error instanceof ArcaTimeoutError) {
      await markUncertain(prepared);
      return {
        type: "uncertain",
        paymentId: prepared.paymentId,
        orderId: prepared.orderId,
        orderNumber: prepared.orderNumber,
      };
    }

    if (error instanceof ArcaBusinessError && error.providerErrorCode === "1") {
      try {
        const status = await client.getOrderStatusExtended({
          orderNumber: prepared.localOrderNumber,
        });
        const mdOrder = status.attributes?.find(
          (a) => a.name === "mdOrder",
        )?.value;
        if (mdOrder && prepared.formUrl) {
          await persistRegistration({
            paymentId: prepared.paymentId,
            orderId: prepared.orderId,
            attemptNumber: prepared.attemptNumber,
            localOrderNumber: prepared.localOrderNumber,
            providerOrderId: mdOrder,
            formUrl: prepared.formUrl,
            eventKind: "ARCA_REGISTER_DUPLICATE_RECOVERED",
          });
          return {
            type: "redirect",
            paymentId: prepared.paymentId,
            orderId: prepared.orderId,
            orderNumber: prepared.orderNumber,
            redirectUrl: prepared.formUrl,
            providerReference: mdOrder,
          };
        }
      } catch {
        // fall through
      }
    }

    await withTransaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, prepared.paymentId))
        .for("update")
        .limit(1);
      if (!payment) return;
      const httpMeta =
        error instanceof ArcaHttpError
          ? {
              httpStatus: error.httpStatus,
              httpStatusText: error.httpStatusText,
              responseContentType: error.responseContentType ?? undefined,
              endpointPath: error.endpointPath,
            }
          : {};
      await tx
        .update(payments)
        .set({
          metadata: mergeArcaPaymentMetadata(payment.metadata, {
            localOrderNumber: prepared.localOrderNumber,
            initializationState: "failed",
            ...registerFailureMetadata(error),
            ...httpMeta,
          }),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
    });

    if (error instanceof ArcaFormUrlRejectedError) {
      throw error;
    }
    throw error;
  }
}

async function persistRegistration(args: {
  paymentId: string;
  orderId: string;
  attemptNumber: number;
  localOrderNumber: string;
  providerOrderId: string;
  formUrl: string;
  eventKind: string;
}): Promise<void> {
  await withTransaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, args.paymentId))
      .for("update")
      .limit(1);

    if (!payment || payment.status !== "PENDING") {
      throw new PaymentNotFoundError();
    }

    // Another request already registered — reuse.
    if (
      payment.providerReference &&
      payment.providerReference !== args.providerOrderId
    ) {
      const meta = readArcaPaymentMetadata(payment.metadata);
      if (meta.arca?.formUrl) {
        return;
      }
    }

    const now = new Date();
    await tx
      .update(payments)
      .set({
        providerReference: args.providerOrderId,
        metadata: mergeArcaPaymentMetadata(payment.metadata, {
          localOrderNumber: args.localOrderNumber,
          formUrl: args.formUrl,
          initializationState: "registered",
        }),
        expiresAt: new Date(now.getTime() + getArcaPendingTimeoutMs()),
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id));

    await tx.insert(orderEvents).values({
      id: createId(),
      orderId: args.orderId,
      eventType: "PAYMENT_PROVIDER",
      fromState: "PENDING",
      toState: "PENDING",
      isCustomerVisible: false,
      provider: "arca",
      providerEventId: `arca:register:${args.providerOrderId}:${args.eventKind}`,
      payload: buildSafePaymentEventPayload({
        kind: args.eventKind,
        provider: "arca",
        paymentId: args.paymentId,
        attemptNumber: args.attemptNumber,
        providerReference: args.providerOrderId,
        status: "PENDING",
      }),
    });
  });
}

function registerFailureMetadata(
  error: unknown,
): Partial<NonNullable<ArcaPaymentMetadata["arca"]>> {
  if (error instanceof ArcaBusinessError) {
    return {
      providerErrorCode: error.providerErrorCode,
      arcaErrorCode: error.providerErrorCode,
      arcaErrorMessage: error.providerErrorMessage,
    };
  }
  if (isArcaProtocolError(error)) {
    return { providerErrorCode: error.code };
  }
  return { providerErrorCode: "ARCA_REGISTER_FAILED" };
}

async function markUncertain(prepared: PreparedAttempt): Promise<void> {
  await withTransaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, prepared.paymentId))
      .for("update")
      .limit(1);
    if (!payment) return;

    await tx
      .update(payments)
      .set({
        metadata: mergeArcaPaymentMetadata(payment.metadata, {
          localOrderNumber: prepared.localOrderNumber,
          initializationState: "uncertain",
        }),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    await tx.insert(orderEvents).values({
      id: createId(),
      orderId: prepared.orderId,
      eventType: "PAYMENT_PROVIDER",
      fromState: "PENDING",
      toState: "PENDING",
      isCustomerVisible: false,
      provider: "arca",
      payload: buildSafePaymentEventPayload({
        kind: "ARCA_REGISTER_UNCERTAIN",
        provider: "arca",
        paymentId: prepared.paymentId,
        attemptNumber: prepared.attemptNumber,
        status: "PENDING",
        errorCode: "ARCA_TIMEOUT",
      }),
    });
  });
}
