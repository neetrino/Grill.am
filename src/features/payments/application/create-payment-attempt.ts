import { and, desc, eq, sql } from "drizzle-orm";

import { orderEvents, orders, payments } from "@/db/schema";
import type { DatabaseTransaction } from "@/db/transaction";
import { nextPaymentAttemptNumber } from "@/features/payments/domain/payment-attempt-number";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import {
  toPaymentRecord,
  type PaymentMethod,
  type PaymentProvider,
} from "@/features/payments/domain/payment-method";
import {
  isUniqueViolation,
  PAYMENTS_ORDER_ATTEMPT_UIDX,
} from "@/features/payments/domain/postgres-errors";
import { createId } from "@/lib/id";

export type CreatePaymentAttemptInput = {
  tx: DatabaseTransaction;
  orderId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown> | null;
};

export type PaymentAttemptRecord = typeof payments.$inferSelect;

const MAX_ATTEMPT_INSERT_RETRIES = 5;

/**
 * Inserts a new PENDING payment attempt for an order.
 *
 * Locks the order row, allocates max(attempt)+1, and retries on the
 * `payments_order_attempt_uidx` unique violation only.
 */
export async function createPaymentAttempt(
  input: CreatePaymentAttemptInput,
): Promise<PaymentAttemptRecord> {
  const { tx, orderId, provider, amount, currency, method } = input;
  const methodLabel = toPaymentRecord(method).method;

  const [lockedOrder] = await tx
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for("update")
    .limit(1);

  if (!lockedOrder) {
    throw new Error("Order not found for payment attempt.");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPT_INSERT_RETRIES; attempt += 1) {
    try {
      return await insertAttempt(tx, {
        orderId,
        provider,
        methodLabel,
        method,
        amount,
        currency,
        metadata: input.metadata ?? null,
      });
    } catch (error) {
      lastError = error;
      if (!isUniqueViolation(error, PAYMENTS_ORDER_ATTEMPT_UIDX)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to allocate a unique payment attempt number.");
}

async function insertAttempt(
  tx: DatabaseTransaction,
  args: {
    orderId: string;
    provider: PaymentProvider;
    methodLabel: string;
    method: PaymentMethod;
    amount: number;
    currency: string;
    metadata: Record<string, unknown> | null;
  },
): Promise<PaymentAttemptRecord> {
  const [maxRow] = await tx
    .select({
      maxAttempt: sql<number | null>`max(${payments.attemptNumber})`,
    })
    .from(payments)
    .where(eq(payments.orderId, args.orderId));

  const attemptNumber = nextPaymentAttemptNumber(maxRow?.maxAttempt);
  const paymentId = createId();
  const now = new Date();

  await tx.insert(payments).values({
    id: paymentId,
    orderId: args.orderId,
    provider: args.provider,
    method: args.methodLabel,
    providerReference: null,
    amount: args.amount,
    currency: args.currency,
    status: "PENDING",
    attemptNumber,
    metadata: args.metadata,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await tx
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!created) {
    throw new Error("Failed to create payment attempt.");
  }

  await tx.insert(orderEvents).values({
    id: createId(),
    orderId: args.orderId,
    eventType: "PAYMENT_PROVIDER",
    fromState: null,
    toState: "PENDING",
    isCustomerVisible: false,
    provider: args.provider,
    payload: buildSafePaymentEventPayload({
      kind: "PAYMENT_ATTEMPT_CREATED",
      provider: args.provider,
      paymentId: created.id,
      attemptNumber: created.attemptNumber,
      status: "PENDING",
      verifiedAmount: args.amount,
      verifiedCurrency: args.currency,
    }),
  });

  return created;
}

/** Returns the latest payment attempt for an order (by attempt number). */
export async function getLatestPaymentAttempt(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<PaymentAttemptRecord | null> {
  const [latest] = await tx
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.attemptNumber))
    .limit(1);

  return latest ?? null;
}

/** Returns the captured payment for an order, if any. */
export async function getCapturedPayment(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<PaymentAttemptRecord | null> {
  const [captured] = await tx
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "CAPTURED")))
    .limit(1);

  return captured ?? null;
}

/**
 * Asserts at most one CAPTURED payment exists (DB also enforces via partial unique).
 */
export async function assertOrderHasAtMostOneCapturedPayment(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<void> {
  const [row] = await tx
    .select({
      cnt: sql<number>`count(*)::int`,
    })
    .from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "CAPTURED")));

  if ((row?.cnt ?? 0) > 1) {
    throw new Error("Order has more than one captured payment.");
  }
}
