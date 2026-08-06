"use server";

import { z } from "zod";

import { expirePaymentAttempt } from "@/features/payments/application/expire-payment-attempt";
import { requireOrdersStaff } from "@/lib/auth/policies";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { createId } from "@/lib/id";

const expireSchema = z.object({
  paymentId: z.string().uuid(),
  locale: z.string().min(2).max(5),
});

export type ExpirePaymentAttemptActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Staff-only: expire an abandoned PENDING/AUTHORIZED attempt under lock. */
export async function expirePaymentAttemptAction(
  raw: unknown,
): Promise<ExpirePaymentAttemptActionResult> {
  const parsed = expireSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }
  if (!isLocale(parsed.data.locale)) {
    return { ok: false, error: "Invalid locale." };
  }

  await requireOrdersStaff(parsed.data.locale as Locale);
  const result = await expirePaymentAttempt({
    paymentId: parsed.data.paymentId,
    correlationId: createId(),
  });

  if (result.type === "expired") {
    return { ok: true, message: "Attempt marked expired (CANCELLED)." };
  }

  return {
    ok: true,
    message: `Skipped (${result.reason}).`,
  };
}
