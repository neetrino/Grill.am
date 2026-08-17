"use server";

import { z } from "zod";

import { getPaymentMethodAvailability } from "@/features/payments/application/get-payment-method-availability";
import {
  PaymentAccessDeniedError,
  assertOrderPaymentAccess,
  assertPaymentBelongsToOrder,
} from "@/features/payments/providers/arca/access";
import { consumeRateLimit } from "@/features/payments/providers/arca/rate-limit";
import { processArcaPaymentStatus } from "@/features/payments/providers/arca/process-arca-status";
import { retryArcaPayment } from "@/features/payments/providers/arca/retry-arca-payment";
import {
  ArcaBusinessError,
  ArcaHttpError,
  isArcaProtocolError,
} from "@/lib/payments/arca/errors";
import {
  isPaymentDomainError,
  PaymentAlreadyCapturedError,
} from "@/features/payments/domain/errors";
import { getCurrentUser } from "@/lib/auth/session";
import { logger } from "@/lib/observability/logger";

const recheckSchema = z.object({
  paymentId: z.string().uuid(),
  orderId: z.string().uuid(),
  locale: z.string().min(2).max(5).optional(),
});

const retrySchema = z.object({
  orderId: z.string().uuid(),
  locale: z.string().min(2).max(5).optional(),
});

export type ArcaRecheckActionResult =
  | {
      ok: true;
      state:
        | "captured"
        | "pending"
        | "failed"
        | "cancelled"
        | "review"
        | "authorized";
    }
  | { ok: false; error: string };

export type ArcaRetryActionResult =
  | {
      ok: true;
      type: "redirect";
      redirectUrl: string;
      paymentId: string;
      orderNumber: string;
    }
  | { ok: true; type: "already_captured"; orderNumber: string }
  | { ok: true; type: "uncertain"; orderNumber: string }
  | { ok: false; error: string };

/**
 * Authenticated / guest-authorized ARCA status recheck.
 * Ignores client-supplied status/amount/currency/reference.
 */
export async function recheckArcaPaymentAction(
  raw: unknown,
): Promise<ArcaRecheckActionResult> {
  const parsed = recheckSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const user = await getCurrentUser();
  const rateKey = `arca:recheck:${user?.id ?? parsed.data.orderId}`;
  const rate = consumeRateLimit({
    key: rateKey,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return { ok: false, error: "Too many requests. Try again shortly." };
  }

  try {
    await assertOrderPaymentAccess(parsed.data.orderId);
    await assertPaymentBelongsToOrder({
      paymentId: parsed.data.paymentId,
      orderId: parsed.data.orderId,
    });

    const result = await processArcaPaymentStatus({
      paymentId: parsed.data.paymentId,
      language: parsed.data.locale,
    });

    switch (result.outcome) {
      case "captured":
      case "already_processed":
        return { ok: true, state: "captured" };
      case "captured_requires_review":
      case "reconciliation_required":
      case "unknown":
      case "refunded":
      case "reversed":
        return { ok: true, state: "review" };
      case "failed":
        return { ok: true, state: "failed" };
      case "cancelled":
        return { ok: true, state: "cancelled" };
      case "authorized":
        return { ok: true, state: "authorized" };
      case "pending":
      default:
        return { ok: true, state: "pending" };
    }
  } catch (error) {
    if (error instanceof PaymentAccessDeniedError) {
      return { ok: false, error: "Access denied." };
    }
    if (isPaymentDomainError(error) || isArcaProtocolError(error)) {
      return { ok: false, error: "Unable to verify payment right now." };
    }
    return { ok: false, error: "Unable to verify payment right now." };
  }
}

/** Creates or reuses an ARCA payment attempt and returns a validated form URL. */
export async function retryArcaPaymentAction(
  raw: unknown,
): Promise<ArcaRetryActionResult> {
  const parsed = retrySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const user = await getCurrentUser();
  const rate = consumeRateLimit({
    key: `arca:retry:${user?.id ?? parsed.data.orderId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return { ok: false, error: "Too many requests. Try again shortly." };
  }

  try {
    const availability = getPaymentMethodAvailability({
      isAdmin: user?.role === "ADMIN",
    });
    if (!availability.arca) {
      return { ok: false, error: "Card payment is temporarily unavailable." };
    }
    const result = await retryArcaPayment({
      orderId: parsed.data.orderId,
      locale: parsed.data.locale,
    });

    if (result.type === "redirect") {
      return {
        ok: true,
        type: "redirect",
        redirectUrl: result.redirectUrl,
        paymentId: result.paymentId,
        orderNumber: result.orderNumber,
      };
    }
    if (result.type === "already_captured") {
      return {
        ok: true,
        type: "already_captured",
        orderNumber: result.orderNumber,
      };
    }
    return {
      ok: true,
      type: "uncertain",
      orderNumber: result.orderNumber,
    };
  } catch (error) {
    if (error instanceof PaymentAccessDeniedError) {
      return { ok: false, error: "Access denied." };
    }
    if (error instanceof PaymentAlreadyCapturedError) {
      return { ok: false, error: "Order is already paid." };
    }
    if (isPaymentDomainError(error) || isArcaProtocolError(error)) {
      const fields: Record<
        string,
        string | number | boolean | null | undefined
      > = {
        provider: "arca",
        orderId: parsed.data.orderId,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : String(error),
      };
      if (isArcaProtocolError(error)) {
        fields.arcaCode = error.code;
      }
      if (error instanceof ArcaBusinessError) {
        fields.providerErrorCode = error.providerErrorCode;
        fields.providerErrorMessage = error.providerErrorMessage;
      }
      if (error instanceof ArcaHttpError) {
        fields.httpStatus = error.httpStatus;
        fields.endpointPath = error.endpointPath;
      }
      logger.error("checkout.arca_retry_failed", fields);
      return { ok: false, error: "Unable to retry payment right now." };
    }
    logger.error("checkout.arca_retry_failed", {
      provider: "arca",
      orderId: parsed.data.orderId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Unable to retry payment right now." };
  }
}
