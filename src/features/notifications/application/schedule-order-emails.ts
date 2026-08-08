import "server-only";

import { after } from "next/server";

import {
  sendOrderEmails,
  type SendOrderEmailsInput,
} from "@/features/notifications/application/send-order-emails";
import { logger } from "@/lib/observability/logger";

/**
 * Schedules order notification emails after the successful response path.
 * Uses Next.js `after()` when in a request scope; otherwise fire-and-forget
 * (e.g. reconcile CLI). Never throws to callers — failures are logged only.
 */
export function scheduleOrderEmails(input: SendOrderEmailsInput): void {
  const run = async (): Promise<void> => {
    try {
      await sendOrderEmails(input);
    } catch (error) {
      logger.error("order_email.after_failed", {
        kind: input.kind,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        paymentId: input.paymentId,
        errorName: error instanceof Error ? error.name : "UNKNOWN",
      });
    }
  };

  try {
    after(() => {
      void run();
    });
  } catch (error) {
    logger.warn("order_email.after_unavailable", {
      kind: input.kind,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      reason: error instanceof Error ? error.message : "not_in_request_scope",
    });
    void run();
  }
}
