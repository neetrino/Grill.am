import { createId } from "@/lib/id";
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

/** Development / default sink — never sends externally. */
export function createSinkEmailDelivery(): EmailDeliveryProvider {
  return {
    name: "sink-email",
    async send(message): Promise<EmailDeliveryResult> {
      const id = createId();
      logger.info("email.sink.send", {
        id,
        to: maskEmail(message.to),
        subject: message.subject,
      });
      return { ok: true, providerMessageId: id };
    },
  };
}

type CapturedEmail = OutboxEmailMessage & {
  id: string;
  capturedAt: string;
};

const GLOBAL_KEY = "__grill_am_email_capture_store__";

function captureStore(): Map<string, CapturedEmail[]> {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: Map<string, CapturedEmail[]>;
  };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map();
  }
  return g[GLOBAL_KEY];
}

/** E2E-only in-process capture inbox. Must not activate in production. */
export function createCaptureEmailDelivery(
  inboxKey = "default",
): EmailDeliveryProvider {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.E2E_EMAIL_MODE !== "mock"
  ) {
    throw new Error("Capture email delivery is forbidden in production.");
  }

  return {
    name: "capture-email",
    async send(message): Promise<EmailDeliveryResult> {
      const id = createId();
      const store = captureStore();
      const list = store.get(inboxKey) ?? [];
      list.push({
        ...message,
        id,
        capturedAt: new Date().toISOString(),
      });
      store.set(inboxKey, list);
      return { ok: true, providerMessageId: id };
    },
  };
}

export function getCapturedEmails(inboxKey = "default"): CapturedEmail[] {
  return [...(captureStore().get(inboxKey) ?? [])];
}

export function clearCapturedEmails(inboxKey = "default"): void {
  captureStore().delete(inboxKey);
}

export function resetAllCapturedEmails(): void {
  captureStore().clear();
}
