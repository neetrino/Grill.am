import "server-only";

import { eq } from "drizzle-orm";

import { payments } from "@/db/schema";
import { getDb } from "@/db/client";
import {
  PaymentAmountMismatchError,
  PaymentCurrencyMismatchError,
  PaymentNotFoundError,
  PaymentProviderNotConfiguredError,
} from "@/features/payments/domain/errors";
import {
  mergeArcaPaymentMetadata,
  readArcaPaymentMetadata,
} from "@/features/payments/providers/arca/metadata";
import {
  arcaAmountMatchesLocal,
  isArcaAmdCurrency,
  normalizeArcaCurrencyCode,
  parseArcaAmountField,
} from "@/lib/payments/arca/amount";
import {
  createArcaPaymentClient,
  type ArcaPaymentClient,
} from "@/lib/payments/arca/client";
import { requireArcaConfig } from "@/lib/payments/arca/config";
import { mapArcaOrderStatus } from "@/lib/payments/arca/status-map";
import { parseOrderStatusCode } from "@/lib/payments/arca/schemas";
import type { ArcaNormalizedState } from "@/lib/payments/arca/types";
import { withTransaction } from "@/db/transaction";

export type VerifyArcaPaymentResult = {
  paymentId: string;
  orderId: string;
  providerReference: string;
  localOrderNumber: string | null;
  orderStatus: number | null;
  normalizedState: ArcaNormalizedState;
  verifiedAmount: number;
  verifiedCurrency: string;
  providerEventId: string;
  officialMeaning: string;
};

/**
 * Authoritative server-to-server status verification (Merchant Manual §7.1.5).
 * Never trusts browser return parameters for success.
 */
export async function verifyArcaPayment(
  input: {
    paymentId: string;
    /** Optional gateway orderId from return URL — must match stored reference when both present. */
    claimedProviderOrderId?: string;
    language?: string;
  },
  deps: { client?: ArcaPaymentClient } = {},
): Promise<VerifyArcaPaymentResult> {
  let config;
  try {
    config = requireArcaConfig();
  } catch {
    throw new PaymentProviderNotConfiguredError("arca");
  }

  const [payment] = await getDb()
    .select()
    .from(payments)
    .where(eq(payments.id, input.paymentId))
    .limit(1);

  if (!payment || payment.provider !== "arca") {
    throw new PaymentNotFoundError();
  }

  const meta = readArcaPaymentMetadata(payment.metadata);
  const providerReference = payment.providerReference;
  const localOrderNumber = meta.arca?.localOrderNumber ?? null;

  if (!providerReference && !localOrderNumber) {
    throw new PaymentNotFoundError();
  }

  if (
    input.claimedProviderOrderId &&
    providerReference &&
    input.claimedProviderOrderId !== providerReference
  ) {
    throw new PaymentNotFoundError();
  }

  const client = deps.client ?? createArcaPaymentClient(config);
  const status = await client.getOrderStatusExtended({
    orderId: providerReference ?? undefined,
    orderNumber: providerReference ? undefined : (localOrderNumber ?? undefined),
    language: input.language ?? config.language,
  });

  if (status.orderNumber && localOrderNumber && status.orderNumber !== localOrderNumber) {
    throw new PaymentNotFoundError();
  }

  const amountMinor = parseArcaAmountField(status.amount);
  if (!arcaAmountMatchesLocal(amountMinor, payment.amount, payment.currency)) {
    throw new PaymentAmountMismatchError();
  }

  const currencyCode = normalizeArcaCurrencyCode(status.currency);
  // Manual: if currency omitted, gateway defaults to 643 — we require AMD (051).
  if (currencyCode !== null && !isArcaAmdCurrency(currencyCode)) {
    throw new PaymentCurrencyMismatchError();
  }
  if (currencyCode === null && payment.currency !== "AMD") {
    throw new PaymentCurrencyMismatchError();
  }
  // When currency omitted but local is AMD, accept only if config currency is 051.
  if (
    currencyCode === null &&
    payment.currency === "AMD" &&
    config.currencyCode !== "051"
  ) {
    throw new PaymentCurrencyMismatchError();
  }

  const orderStatus = parseOrderStatusCode(status.orderStatus);
  const mapping = mapArcaOrderStatus(orderStatus, config.paymentMode);
  const resolvedReference =
    providerReference ??
    status.attributes?.find((a) => a.name === "mdOrder")?.value ??
    input.claimedProviderOrderId;

  if (!resolvedReference) {
    throw new PaymentNotFoundError();
  }

  await withTransaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, payment.id))
      .for("update")
      .limit(1);
    if (!locked) return;
    await tx
      .update(payments)
      .set({
        providerReference: locked.providerReference ?? resolvedReference,
        metadata: mergeArcaPaymentMetadata(locked.metadata, {
          lastVerifiedAt: new Date().toISOString(),
          lastOrderStatus: orderStatus,
          lastNormalizedState: mapping.localState,
        }),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, locked.id));
  });

  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    providerReference: resolvedReference,
    localOrderNumber,
    orderStatus,
    normalizedState: mapping.localState,
    verifiedAmount: payment.amount,
    verifiedCurrency: payment.currency,
    providerEventId: `arca:status:${resolvedReference}:${orderStatus ?? "none"}`,
    officialMeaning: mapping.officialMeaning,
  };
}
