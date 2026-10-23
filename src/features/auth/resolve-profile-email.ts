import { z } from "zod";

import { isSmsPlaceholderEmail } from "@/lib/auth/otp/sms-placeholder-user";

const submittedEmailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

export type ProfileEmailUpdate =
  | { ok: true; email: string | null }
  | { ok: false };

/**
 * Email persisted by the personal-information save.
 * A blank field keeps null or an SMS placeholder. It does not clear a real address.
 */
export function resolveProfileEmailUpdate(
  storedEmail: string | null,
  submittedEmail: string,
): ProfileEmailUpdate {
  const submitted = submittedEmail.trim();
  if (submitted.length === 0) {
    if (storedEmail === null) {
      return { ok: true, email: null };
    }
    if (isSmsPlaceholderEmail(storedEmail)) {
      return { ok: true, email: storedEmail };
    }
    return { ok: false };
  }

  const parsed = submittedEmailSchema.safeParse(submitted);
  if (!parsed.success) {
    return { ok: false };
  }
  return { ok: true, email: parsed.data };
}
