"use server";

import { z } from "zod";

import { refundArcaPayment } from "@/features/payments/application/refund-arca-payment";
import {
  mapStaffArcaRefundError,
  staffRefundErrorClass,
  staffRefundProviderErrorCode,
} from "@/features/payments/domain/map-staff-arca-refund-error";
import { consumeRateLimit } from "@/features/payments/providers/arca/rate-limit";
import { requireOrdersStaff } from "@/lib/auth/policies";
import { createId } from "@/lib/id";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { logPaymentError } from "@/features/payments/domain/payment-logging";

const refundSchema = z.object({
  paymentId: z.string().uuid(),
  locale: z.string().min(2).max(5),
});

export type RefundArcaPaymentActionResult =
  | { ok: true; message: string }
  | { ok: false; code: string; error: string };

/** Staff-only full ARCA refund. ADMIN and OPERATOR. */
export async function refundArcaPaymentAction(
  raw: unknown,
): Promise<RefundArcaPaymentActionResult> {
  const parsed = refundSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid request." };
  }
  if (!isLocale(parsed.data.locale)) {
    return { ok: false, code: "INVALID_LOCALE", error: "Invalid locale." };
  }

  const actor = await requireOrdersStaff(parsed.data.locale as Locale);
  const rate = consumeRateLimit({
    key: `arca:refund:${parsed.data.paymentId}:${actor.id}`,
    limit: 3,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return {
      ok: false,
      code: "TOO_MANY_REQUESTS",
      error: "Too many refund attempts. Try again shortly.",
    };
  }

  const correlationId = createId();
  try {
    const result = await refundArcaPayment({
      paymentId: parsed.data.paymentId,
      actorUserId: actor.id,
      correlationId,
    });

    if (result.type === "already_processed") {
      return { ok: true, message: "Payment is already refunded." };
    }
    if (result.method === "reverse") {
      return { ok: true, message: "Payment reversed at the bank." };
    }
    if (result.method === "already_at_provider") {
      return { ok: true, message: "Bank already returned the funds." };
    }
    return { ok: true, message: "Payment refunded at the bank." };
  } catch (error) {
    const mapped = mapStaffArcaRefundError(error);
    logPaymentError("payment.refund_failed", {
      operation: "refund",
      paymentId: parsed.data.paymentId,
      provider: "arca",
      correlationId,
      errorCode: mapped.code,
      errorClass: staffRefundErrorClass(error),
      providerErrorCode: staffRefundProviderErrorCode(error),
    });
    return { ok: false, code: mapped.code, error: mapped.message };
  }
}
