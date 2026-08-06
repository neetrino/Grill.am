"use server";

import { z } from "zod";

import {
  PaymentAccessDeniedError,
  assertOrderPaymentAccess,
} from "@/features/payments/providers/arca/access";
import { consumeRateLimit } from "@/features/payments/providers/arca/rate-limit";
import { retryIdramPayment } from "@/features/payments/providers/idram/retry-idram-payment";
import {
  isPaymentDomainError,
  PaymentAlreadyCapturedError,
} from "@/features/payments/domain/errors";
import { isIdramProtocolError } from "@/lib/payments/idram/errors";
import { getCurrentUser } from "@/lib/auth/session";

const retrySchema = z.object({
  orderId: z.string().uuid(),
  locale: z.string().min(2).max(5).optional(),
});

export type IdramRetryActionResult =
  | {
      ok: true;
      type: "payment_form_required";
      action: string;
      method: "POST";
      fields: Record<string, string>;
      paymentId: string;
      orderNumber: string;
    }
  | { ok: false; error: string };

/** Creates or reuses an iDram payment attempt and returns the POST form payload. */
export async function retryIdramPaymentAction(
  raw: unknown,
): Promise<IdramRetryActionResult> {
  const parsed = retrySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const user = await getCurrentUser();
  const rate = consumeRateLimit({
    key: `idram:retry:${user?.id ?? parsed.data.orderId}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return { ok: false, error: "Too many requests. Try again shortly." };
  }

  try {
    await assertOrderPaymentAccess(parsed.data.orderId);
    const form = await retryIdramPayment({
      orderId: parsed.data.orderId,
      locale: parsed.data.locale,
    });

    return {
      ok: true,
      type: "payment_form_required",
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
    if (error instanceof PaymentAlreadyCapturedError) {
      return { ok: false, error: "Order is already paid." };
    }
    if (isPaymentDomainError(error) || isIdramProtocolError(error)) {
      return { ok: false, error: "Unable to retry payment right now." };
    }
    return { ok: false, error: "Unable to retry payment right now." };
  }
}
