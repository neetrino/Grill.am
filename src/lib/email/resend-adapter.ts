import "server-only";

import { Resend } from "resend";

import type {
  EmailDeliveryProvider,
  EmailDeliveryResult,
  OutboxEmailMessage,
} from "@/lib/email/delivery";
import { logger } from "@/lib/observability/logger";

function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at <= 1) return "***";
  return `${value.slice(0, 1)}***${value.slice(at)}`;
}

export type ResendEmailDeliveryOptions = {
  apiKey: string;
  from: string;
};

/**
 * Production email delivery via Resend.
 * Uses Idempotency-Key when provided to reduce duplicate sends on retry.
 */
export function createResendEmailDelivery(
  options: ResendEmailDeliveryOptions,
): EmailDeliveryProvider {
  const client = new Resend(options.apiKey);

  return {
    name: "resend-email",
    async send(message: OutboxEmailMessage): Promise<EmailDeliveryResult> {
      try {
        const result = await client.emails.send(
          {
            from: options.from,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
          },
          message.idempotencyKey
            ? { idempotencyKey: message.idempotencyKey }
            : undefined,
        );

        if (result.error) {
          const statusCode = result.error.statusCode;
          const retryable =
            statusCode == null ||
            statusCode === 408 ||
            statusCode === 429 ||
            statusCode >= 500;
          logger.warn("email.resend.send_failed", {
            to: maskEmail(message.to),
            name: result.error.name,
            statusCode,
            retryable,
          });
          return {
            ok: false,
            retryable,
            errorCode: result.error.name || "RESEND_ERROR",
            safeMessage: "Resend delivery failed",
          };
        }

        const providerMessageId = result.data?.id;
        if (!providerMessageId) {
          return {
            ok: false,
            retryable: true,
            errorCode: "RESEND_EMPTY_ID",
            safeMessage: "Resend returned no message id",
          };
        }

        logger.info("email.resend.sent", {
          to: maskEmail(message.to),
          providerMessageId,
        });
        return { ok: true, providerMessageId };
      } catch (error) {
        logger.warn("email.resend.exception", {
          to: maskEmail(message.to),
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
        return {
          ok: false,
          retryable: true,
          errorCode: "RESEND_EXCEPTION",
          safeMessage: "Resend request failed",
        };
      }
    },
  };
}
