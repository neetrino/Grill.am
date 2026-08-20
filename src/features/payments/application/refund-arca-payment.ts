import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  decideArcaFullRefund,
  isArcaReverseUnavailable,
} from "@/features/payments/domain/arca-full-refund-decision";
import { isArcaRefundClaimActive } from "@/features/payments/domain/arca-refund-claim";
import {
  PaymentNotFoundError,
  PaymentRefundInProgressError,
  PaymentRefundNotAllowedError,
  PaymentRefundUnconfirmedError,
} from "@/features/payments/domain/errors";
import { markPaymentRefunded } from "@/features/payments/application/mark-payment-refunded";
import {
  mergeArcaPaymentMetadata,
  readArcaPaymentMetadata,
} from "@/features/payments/providers/arca/metadata";
import { verifyArcaPayment } from "@/features/payments/providers/arca/verify-arca-payment";
import { toArcaAmountMinorUnits } from "@/lib/payments/arca/amount";
import {
  createArcaPaymentClient,
  type ArcaPaymentClient,
} from "@/lib/payments/arca/client";
import { ArcaBusinessError } from "@/lib/payments/arca/errors";

export type RefundArcaPaymentInput = {
  paymentId: string;
  actorUserId?: string;
  correlationId: string;
};

export type RefundArcaPaymentResult = {
  type: "refunded" | "already_processed";
  orderId: string;
  paymentId: string;
  orderNumber: string;
  method: "reverse" | "refund" | "already_at_provider";
};

export type RefundArcaPaymentDeps = {
  client?: ArcaPaymentClient;
};

/**
 * Full one-stage ARCA refund: reverse when the bank still allows it,
 * otherwise refund.do for the original captured amount.
 */
export async function refundArcaPayment(
  input: RefundArcaPaymentInput,
  deps: RefundArcaPaymentDeps = {},
): Promise<RefundArcaPaymentResult> {
  const claimed = await claimArcaRefund(input);
  if (claimed.type === "already_processed") {
    return claimed;
  }
  const payment = claimed.payment;

  const client = deps.client ?? createArcaPaymentClient();
  const first = await verifyArcaPayment(
    { paymentId: payment.id },
    { client },
  );
  const firstDecision = decideArcaFullRefund(first.normalizedState);
  if (firstDecision.action === "reject") {
    throw new PaymentRefundNotAllowedError();
  }
  if (firstDecision.action === "mark_refunded") {
    return applyLocalRefund(input, "already_at_provider", client);
  }
  if (claimed.type === "existing_claim") {
    throw new PaymentRefundInProgressError();
  }

  const method = await reverseThenRefund({
    client,
    paymentId: payment.id,
    providerOrderId: first.providerReference,
    amount: payment.amount,
    currency: payment.currency,
  });

  return applyLocalRefund(input, method, client);
}

async function loadRefundableArcaPayment(paymentId: string): Promise<{
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  amount: number;
  currency: string;
}> {
  const [row] = await getDb()
    .select({
      id: payments.id,
      orderId: payments.orderId,
      orderNumber: orders.orderNumber,
      status: payments.status,
      amount: payments.amount,
      currency: payments.currency,
      provider: payments.provider,
      providerReference: payments.providerReference,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!row) {
    throw new PaymentNotFoundError();
  }
  if (row.provider !== "arca" || !row.providerReference) {
    throw new PaymentRefundNotAllowedError();
  }
  if (row.status !== "CAPTURED" && row.status !== "REFUNDED") {
    throw new PaymentRefundNotAllowedError();
  }
  return row;
}

async function claimArcaRefund(
  input: RefundArcaPaymentInput,
): Promise<
  | { type: "already_processed" } & RefundArcaPaymentResult
  | {
      type: "claimed" | "existing_claim";
      payment: {
        id: string;
        orderId: string;
        orderNumber: string;
        status: string;
        amount: number;
        currency: string;
      };
    }
> {
  return withTransaction(async (tx) => {
    const payment = await loadRefundableArcaPayment(input.paymentId);
    if (payment.status === "REFUNDED") {
      return {
        type: "already_processed" as const,
        orderId: payment.orderId,
        paymentId: payment.id,
        orderNumber: payment.orderNumber,
        method: "already_at_provider" as const,
      };
    }

    const [locked] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, payment.id))
      .for("update")
      .limit(1);
    if (!locked || locked.status !== "CAPTURED") {
      throw new PaymentRefundNotAllowedError();
    }

    const meta = readArcaPaymentMetadata(locked.metadata);
    if (isArcaRefundClaimActive(meta.arca?.refundClaimedAt)) {
      return { type: "existing_claim" as const, payment };
    }

    await tx
      .update(payments)
      .set({
        metadata: mergeArcaPaymentMetadata(locked.metadata, {
          refundClaimedAt: new Date().toISOString(),
          refundClaimId: input.correlationId,
        }),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, locked.id));

    return { type: "claimed" as const, payment };
  });
}

async function reverseThenRefund(input: {
  client: ArcaPaymentClient;
  paymentId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
}): Promise<"reverse" | "refund"> {
  const amountMinorUnits = toArcaAmountMinorUnits(input.amount, input.currency);
  try {
    await input.client.reverse({ orderId: input.providerOrderId });
    return "reverse";
  } catch (error) {
    if (
      error instanceof ArcaBusinessError &&
      isArcaReverseUnavailable(error.providerErrorCode)
    ) {
      await input.client.refund({
        orderId: input.providerOrderId,
        amountMinorUnits,
      });
      return "refund";
    }
    if (await isAlreadyReturnedAtBank(input.paymentId, input.client)) {
      return "reverse";
    }
    throw error;
  }
}

async function isAlreadyReturnedAtBank(
  paymentId: string,
  client: ArcaPaymentClient,
): Promise<boolean> {
  const verified = await verifyArcaPayment({ paymentId }, { client });
  return decideArcaFullRefund(verified.normalizedState).action === "mark_refunded";
}

async function applyLocalRefund(
  input: RefundArcaPaymentInput,
  method: RefundArcaPaymentResult["method"],
  client: ArcaPaymentClient,
): Promise<RefundArcaPaymentResult> {
  const verified = await verifyArcaPayment(
    { paymentId: input.paymentId },
    { client },
  );
  if (decideArcaFullRefund(verified.normalizedState).action !== "mark_refunded") {
    throw new PaymentRefundUnconfirmedError();
  }

  const marked = await markPaymentRefunded({
    paymentId: input.paymentId,
    actorUserId: input.actorUserId,
    correlationId: input.correlationId,
    providerEventId: `${verified.providerEventId}:refunded`,
    bankState:
      verified.normalizedState === "reversed" ? "reversed" : "refunded",
  });

  return {
    type: marked.type,
    orderId: marked.orderId,
    paymentId: marked.paymentId,
    orderNumber: marked.orderNumber,
    method,
  };
}
