"use server";

import { eq } from "drizzle-orm";

import { getEnv } from "@/config/env";
import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { forgotPasswordSchema } from "@/features/auth/schemas";
import { renderPasswordResetEmail } from "@/features/notifications/templates/password-reset-email-template";
import { getStoreIdentity } from "@/features/settings/application/queries";
import { passwordResetRecipient } from "@/lib/auth/password-login";
import {
  issuePasswordResetToken,
  PASSWORD_RESET_TTL_SECONDS,
} from "@/lib/auth/password-reset-tokens";
import { getEmailDelivery } from "@/lib/email/get-email-delivery";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { logger } from "@/lib/observability/logger";

export type ForgotPasswordActionState = {
  error?: string;
  sent?: boolean;
};

export async function forgotPasswordAction(
  localeInput: string,
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const locale: Locale = isLocale(localeInput) ? localeInput : defaultLocale;
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email address." };
  }

  try {
    const [user] = await getDb()
      .select({ id: users.id, email: users.email, status: users.status })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    const recipient =
      user === undefined
        ? null
        : passwordResetRecipient({
            email: user.email,
            status: user.status,
          });

    if (user !== undefined && recipient !== null) {
      const providers = getProviders();
      const rawToken = await issuePasswordResetToken(
        providers.redis.getClient(),
        user.id,
      );
      const resetUrl = new URL(
        `/${locale}/reset-password`,
        getEnv().NEXT_PUBLIC_APP_URL,
      );
      resetUrl.searchParams.set("token", rawToken);

      const identity = await getStoreIdentity();
      const email = renderPasswordResetEmail({
        locale,
        storeName: identity.name,
        resetUrl: resetUrl.toString(),
        ttlMinutes: PASSWORD_RESET_TTL_SECONDS / 60,
      });
      const result = await getEmailDelivery().send({
        to: recipient,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      // Still report `sent` on failure so the response does not reveal which emails have accounts.
      if (!result.ok) {
        logger.error("auth.forgot_password.email_failed", {
          errorCode: result.errorCode,
          safeMessage: result.safeMessage,
          retryable: result.retryable,
        });
      }
    }
  } catch (error) {
    logger.error("auth.forgot_password_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      error: "Unable to process the request right now. Please try again.",
    };
  }

  return { sent: true };
}
