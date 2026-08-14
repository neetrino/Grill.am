import "server-only";

import { Resend } from "resend";

import type {
  EmailDeliveryProvider,
  EmailDeliveryResult,
  OutboxEmailMessage,
} from "@/lib/email/delivery";
import { logger } from "@/lib/observability/logger";

const RESEND_ERROR_MESSAGE_MAX_LEN = 200;

function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at <= 1) return "***";
  return `${value.slice(0, 1)}***${value.slice(at)}`;
}

/** Truncates and redacts Resend error text for logs and safeMessage. */
function toSafeResendErrorMessage(raw: unknown): string | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  const redacted = trimmed
    .replace(/re_[A-Za-z0-9_]+/gi, "[REDACTED]")
    .replace(/\bsk_[A-Za-z0-9_]+/gi, "[REDACTED]");
  if (redacted.length <= RESEND_ERROR_MESSAGE_MAX_LEN) {
    return redacted;
  }
  return `${redacted.slice(0, RESEND_ERROR_MESSAGE_MAX_LEN - 3)}...`;
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
          const errorMessage = toSafeResendErrorMessage(result.error.message);
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
            ...(errorMessage ? { errorMessage } : {}),
          });
          const safeMessage = errorMessage
            ? `Resend delivery failed: ${errorMessage}`
            : "Resend delivery failed";
          return {
            ok: false,
            retryable,
            errorCode: result.error.name || "RESEND_ERROR",
            safeMessage,
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
