import "server-only";

import {
  createCaptureEmailDelivery,
  createSinkEmailDelivery,
} from "@/lib/email/capture-adapter";
import type { EmailDeliveryProvider } from "@/lib/email/delivery";

/**
 * Selects outbox delivery provider.
 * Production: sink until Resend (or other) is wired — never accidental mock inbox.
 */
export function getOutboxEmailDelivery(): EmailDeliveryProvider {
  const mode = process.env.E2E_EMAIL_MODE?.trim().toLowerCase();
  if (mode === "mock" || mode === "capture") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("E2E_EMAIL_MODE=mock is forbidden in production.");
    }
    return createCaptureEmailDelivery("e2e");
  }

  return createSinkEmailDelivery();
}
