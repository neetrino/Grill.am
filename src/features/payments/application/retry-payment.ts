"use server";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import { getPaymentMethodAvailability } from "@/features/payments/application/get-payment-method-availability";
import {
  PaymentAccessDeniedError,
  assertOrderPaymentAccess,
} from "@/features/payments/providers/arca/access";
import { retryArcaPayment } from "@/features/payments/providers/arca/retry-arca-payment";
import { retryIdramPayment } from "@/features/payments/providers/idram/retry-idram-payment";
import { consumeRateLimit } from "@/features/payments/providers/arca/rate-limit";
import {
  isPaymentDomainError,
  PaymentAlreadyCapturedError,
  PaymentAlreadyRefundedError,
} from "@/features/payments/domain/errors";
import { isPaymentRetryBlockedByRefund } from "@/features/payments/domain/refund-retry-barrier";
import {
  logPaymentInfo,
  logPaymentWarn,
} from "@/features/payments/domain/payment-logging";
import {
  PAYMENT_METRIC_NAMES,
  paymentMetrics,
} from "@/features/payments/domain/payment-metrics";
import { createId } from "@/lib/id";
import { getCurrentUser } from "@/lib/auth/session";
import { isArcaProtocolError } from "@/lib/payments/arca/errors";
import { isIdramProtocolError } from "@/lib/payments/idram/errors";

const retrySchema = z.object({
  orderId: z.string().uuid(),
  locale: z.string().min(2).max(5).optional(),
  provider: z.enum(["arca", "idram"]).optional(),
});

export type UnifiedRetryPaymentResult =
  | {
      ok: true;
      type: "redirect";
      provider: "arca";
      redirectUrl: string;
      paymentId: string;
      orderNumber: string;
    }
  | {
      ok: true;
      type: "payment_form_required";
      provider: "idram";
      action: string;
      method: "POST";
      fields: Record<string, string>;
      paymentId: string;
      orderNumber: string;
    }
  | { ok: true; type: "already_captured"; orderNumber: string }
  | { ok: true; type: "uncertain"; orderNumber: string; paymentId: string }
  | { ok: false; error: string };

/**
 * Unified customer retry entry: owner/guest auth, reject captured/review,
 * delegate to provider services, preserve prior attempts.
 */
export async function retryPaymentAction(
  raw: unknown,
): Promise<UnifiedRetryPaymentResult> {
  const parsed = retrySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const correlationId = createId();
  const user = await getCurrentUser();
  const rate = consumeRateLimit({
    key: `payment:retry:${user?.id ?? parsed.data.orderId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return { ok: false, error: "Too many requests. Try again shortly." };
  }

  try {
    const { order } = await assertOrderPaymentAccess(parsed.data.orderId);

    if (order.paymentStatus === "CAPTURED") {
      return {
        ok: true,
        type: "already_captured",
        orderNumber: order.orderNumber,
      };
    }

    if (order.status === "REQUIRES_REVIEW") {
      return {
        ok: false,
        error: "This order is under review and cannot be retried.",
      };
    }

    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      return { ok: false, error: "This order can no longer be paid." };
    }

    const [latestAttempt] = await getDb()
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(desc(payments.attemptNumber))
      .limit(1);

    if (latestAttempt?.status === "CAPTURED") {
      return {
        ok: true,
        type: "already_captured",
        orderNumber: order.orderNumber,
      };
    }

    if (
      isPaymentRetryBlockedByRefund(
        order.paymentStatus,
        latestAttempt?.status ?? null,
      )
    ) {
      return { ok: false, error: "This order can no longer be paid." };
    }

    const availability = getPaymentMethodAvailability({
      isAdmin: user?.role === "ADMIN",
    });
    const preferred =
      parsed.data.provider ??
      (latestAttempt?.provider === "idram" || latestAttempt?.provider === "arca"
        ? latestAttempt.provider
        : "arca");

    if (
      parsed.data.provider &&
      latestAttempt &&
      (latestAttempt.status === "PENDING" ||
        latestAttempt.status === "AUTHORIZED") &&
      parsed.data.provider !== latestAttempt.provider
    ) {
      return {
        ok: false,
        error:
          "A payment attempt is still open. Check status before switching method.",
      };
    }

    paymentMetrics.increment(PAYMENT_METRIC_NAMES.retry, {
      provider: preferred,
      operation: "retry",
      resultClass: "requested",
    });

    if (preferred === "arca") {
      if (!availability.arca) {
        return { ok: false, error: "Card payment is temporarily unavailable." };
      }
      const result = await retryArcaPayment({
        orderId: order.id,
        locale: parsed.data.locale,
      });
      logPaymentInfo("payment.retry", {
        correlationId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: result.type === "redirect" ? result.paymentId : null,
        provider: "arca",
        operation: "retry_payment",
        result: result.type,
      });
      if (result.type === "redirect") {
        return {
          ok: true,
          type: "redirect",
          provider: "arca",
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
        paymentId: result.paymentId,
      };
    }

    if (!availability.idram) {
      return { ok: false, error: "iDram payment is temporarily unavailable." };
    }

    const form = await retryIdramPayment({
      orderId: order.id,
      locale: parsed.data.locale,
    });
    logPaymentInfo("payment.retry", {
      correlationId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: form.paymentId,
      provider: "idram",
      operation: "retry_payment",
      result: "payment_form_required",
    });
    return {
      ok: true,
      type: "payment_form_required",
      provider: "idram",
      action: form.action,
      method: "POST",
      fields: form.fields,
      paymentId: form.paymentId,
      orderNumber: form.orderNumber,
    };
  } catch (error) {
    if (error instanceof PaymentAccessDeniedError) {
      return { ok: false, error: "Access denied." };
    }
    if (error instanceof PaymentAlreadyRefundedError) {
      return { ok: false, error: "This order can no longer be paid." };
    }
    if (error instanceof PaymentAlreadyCapturedError) {
      const [order] = await getDb()
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(eq(orders.id, parsed.data.orderId))
        .limit(1);
      return {
        ok: true,
        type: "already_captured",
        orderNumber: order?.orderNumber ?? "",
      };
    }
    logPaymentWarn("payment.retry_failed", {
      correlationId,
      orderId: parsed.data.orderId,
      operation: "retry_payment",
      errorCode:
        isPaymentDomainError(error) ||
        isArcaProtocolError(error) ||
        isIdramProtocolError(error)
          ? error.code
          : "unknown",
    });
    if (
      isPaymentDomainError(error) ||
      isArcaProtocolError(error) ||
      isIdramProtocolError(error)
    ) {
      return { ok: false, error: "Unable to retry payment right now." };
    }
    return { ok: false, error: "Unable to retry payment right now." };
  }
}
