import "server-only";

import { getEnv } from "@/config/env";
import {
  createCaptureEmailDelivery,
  createSinkEmailDelivery,
} from "@/lib/email/capture-adapter";
import type { EmailDeliveryProvider } from "@/lib/email/delivery";
import { createResendEmailDelivery } from "@/lib/email/resend-adapter";
import { logger } from "@/lib/observability/logger";

let resendSelectionLogged = false;

/** Domain portion of EMAIL_FROM for startup diagnostics (no addresses or secrets). */
function extractFromDomain(emailFrom: string): string {
  const trimmed = emailFrom.trim();
  const bracketMatch = trimmed.match(/<([^>]+)>/);
  const email = (bracketMatch?.[1] ?? trimmed).trim();
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) {
    return "unknown";
  }
  return email.slice(at + 1);
}

function logResendSelectedOnce(fromDomain: string): void {
  if (resendSelectionLogged) {
    return;
  }
  resendSelectionLogged = true;
  logger.info("email.delivery.resend_selected", { fromDomain });
}

/**
 * Selects email delivery provider.
 * Priority: E2E capture → Resend (when credentials present) → sink.
 */
export function getEmailDelivery(): EmailDeliveryProvider {
  const mode = process.env.E2E_EMAIL_MODE?.trim().toLowerCase();
  if (mode === "mock" || mode === "capture") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("E2E_EMAIL_MODE=mock is forbidden in production.");
    }
    return createCaptureEmailDelivery("e2e");
  }

  const env = getEnv();
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    logResendSelectedOnce(extractFromDomain(env.EMAIL_FROM));
    return createResendEmailDelivery({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
    });
  }

  logger.info("email.delivery.sink_fallback", {
    reason: "missing_resend_credentials",
  });
  return createSinkEmailDelivery();
}
