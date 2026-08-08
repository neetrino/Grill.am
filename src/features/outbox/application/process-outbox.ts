import "server-only";

import { eq } from "drizzle-orm";

import { getEnv } from "@/config/env";
import { getDb } from "@/db/client";
import { orders, outboxEvents } from "@/db/schema";
import {
  withTransaction,
  type DatabaseTransaction,
} from "@/db/transaction";
import { computeOutboxBackoffMs } from "@/features/outbox/domain/backoff";
import {
  claimOutboxBatch,
  markOutboxFailed,
  markOutboxRetry,
  markOutboxSent,
} from "@/features/outbox/application/claim-outbox";
import { getOutboxEmailDelivery } from "@/features/outbox/application/email-delivery";
import { renderAdminOrderEmail } from "@/features/outbox/templates/admin-order-email-template";
import {
  renderCustomerCodOrderCreatedEmail,
  renderCustomerPaymentCapturedEmail,
  renderCustomerPaymentFailedEmail,
  renderCustomerReviewEmail,
} from "@/features/outbox/templates/customer-order-email-template";
import {
  renderReviewOperatorEmail,
  type PaymentEmailTemplateInput,
} from "@/features/outbox/templates/payment-email-templates";
import {
  getAdminOrderById,
} from "@/features/orders/application/queries";
import { toAdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { getStoreIdentity } from "@/features/settings/application/queries";
import type { EmailDeliveryProvider } from "@/lib/email/delivery";
import { createId } from "@/lib/id";
import { formatMoneyAmount } from "@/lib/money/format";
import { defaultCurrency, isCurrency } from "@/lib/money/currency";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { logger } from "@/lib/observability/logger";

export type ProcessOutboxBatchResult = {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
  workerId: string;
};

type OutboxOrderRow = typeof orders.$inferSelect;

const RICH_CUSTOMER_ORDER_EVENTS = new Set([
  "COD_ORDER_CREATED",
  "ONLINE_PAYMENT_CAPTURED",
  "ONLINE_PAYMENT_FAILED",
  "ONLINE_PAYMENT_CANCELLED",
  "PAYMENT_REQUIRES_REVIEW_CUSTOMER",
]);

type ProcessOutboxDeps = {
  batchSize?: number;
  workerId?: string;
  delivery?: EmailDeliveryProvider;
  /** Injected for integration tests that use a dedicated DB pool. */
  withTx?: <T>(
    operation: (tx: DatabaseTransaction) => Promise<T>,
  ) => Promise<T>;
  loadOrder?: (orderId: string) => Promise<OutboxOrderRow | null>;
};

function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at <= 1) return "***";
  return `${value.slice(0, 1)}***${value.slice(at)}`;
}

/** Prefer ADMIN_EMAIL, then OPS_ALERT_EMAIL for operator destinations. */
function resolveOperatorEmail(): string | undefined {
  const adminEmail = getEnv().ADMIN_EMAIL?.trim();
  if (adminEmail) {
    return adminEmail;
  }
  const opsAlert = process.env.OPS_ALERT_EMAIL?.trim();
  return opsAlert || undefined;
}

async function defaultLoadOrder(orderId: string): Promise<OutboxOrderRow | null> {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return order ?? null;
}

async function buildAdminOrderMessage(
  row: typeof outboxEvents.$inferSelect,
  locale: Locale,
): Promise<{
  to: string;
  subject: string;
  html: string;
  text: string;
} | null> {
  const to = resolveOperatorEmail();
  if (!to) {
    logger.warn("outbox.admin_order.missing_recipient", {
      outboxId: row.id,
      orderId: row.aggregateId,
    });
    return null;
  }

  const detail = await getAdminOrderById(row.aggregateId);
  if (!detail) {
    return null;
  }

  const identity = await getStoreIdentity();
  const view = toAdminOrderDetailView(detail, identity.name);
  const rendered = renderAdminOrderEmail({
    locale,
    storeName: identity.name,
    detail: view,
  });

  return {
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  };
}

async function buildRichCustomerOrderMessage(
  row: typeof outboxEvents.$inferSelect,
  order: OutboxOrderRow,
  locale: Locale,
  eventType: string,
): Promise<{
  to: string;
  subject: string;
  html: string;
  text: string;
} | null> {
  const detail = await getAdminOrderById(row.aggregateId);
  if (!detail) {
    return null;
  }

  const identity = await getStoreIdentity();
  const view = toAdminOrderDetailView(detail, identity.name);
  const currency = isCurrency(order.baseCurrency)
    ? order.baseCurrency
    : defaultCurrency;
  const amountFormatted = formatMoneyAmount(order.totalAmount, currency, locale);
  const customerInput = {
    locale,
    storeName: identity.name,
    detail: view,
    amountFormatted,
  };

  let rendered;
  switch (eventType) {
    case "COD_ORDER_CREATED":
      rendered = renderCustomerCodOrderCreatedEmail(customerInput);
      break;
    case "ONLINE_PAYMENT_CAPTURED":
      rendered = renderCustomerPaymentCapturedEmail(customerInput);
      break;
    case "ONLINE_PAYMENT_FAILED":
    case "ONLINE_PAYMENT_CANCELLED":
      rendered = renderCustomerPaymentFailedEmail(customerInput);
      break;
    case "PAYMENT_REQUIRES_REVIEW_CUSTOMER":
      rendered = renderCustomerReviewEmail(customerInput);
      break;
    default:
      return null;
  }

  return {
    to: order.contactEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  };
}

async function buildMessageForRow(
  row: typeof outboxEvents.$inferSelect,
  loadOrder: (orderId: string) => Promise<OutboxOrderRow | null>,
): Promise<{
  to: string;
  subject: string;
  html: string;
  text: string;
} | null> {
  const payload = row.payload ?? {};
  const orderNumber =
    typeof payload.orderNumber === "string" ? payload.orderNumber : "";
  const localeRaw = typeof payload.locale === "string" ? payload.locale : "en";
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "en";
  const recipientRole =
    payload.recipientRole === "operator" ? "operator" : "customer";

  if (row.eventType === "ADMIN_ORDER_NOTIFY") {
    return buildAdminOrderMessage(row, locale);
  }

  const order = await loadOrder(row.aggregateId);
  if (!order) {
    return null;
  }

  if (
    recipientRole === "customer" &&
    RICH_CUSTOMER_ORDER_EVENTS.has(row.eventType)
  ) {
    return buildRichCustomerOrderMessage(row, order, locale, row.eventType);
  }

  const currency = isCurrency(order.baseCurrency)
    ? order.baseCurrency
    : defaultCurrency;
  const amountFormatted = formatMoneyAmount(
    order.totalAmount,
    currency,
    locale,
  );

  const templateInput: PaymentEmailTemplateInput = {
    locale,
    orderNumber: orderNumber || order.orderNumber,
    amountFormatted,
    contactName: order.contactName,
  };

  let rendered;
  switch (row.eventType) {
    case "PAYMENT_REQUIRES_REVIEW_OPERATOR":
      rendered = renderReviewOperatorEmail(templateInput);
      break;
    default:
      return null;
  }

  const to =
    recipientRole === "operator"
      ? (resolveOperatorEmail() || order.contactEmail)
      : order.contactEmail;

  return {
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  };
}

/**
 * Claims one batch, delivers outside DB locks, then finalizes state.
 */
export async function processOutboxOnce(
  input?: ProcessOutboxDeps,
): Promise<ProcessOutboxBatchResult> {
  const workerId = input?.workerId ?? `worker-${createId().slice(0, 8)}`;
  const delivery = input?.delivery ?? getOutboxEmailDelivery();
  const batchSize = input?.batchSize ?? 10;
  const runTx = input?.withTx ?? withTransaction;
  const loadOrder = input?.loadOrder ?? defaultLoadOrder;

  const claimed = await runTx((tx) =>
    claimOutboxBatch(tx, { workerId, batchSize }),
  );

  let sent = 0;
  let retried = 0;
  let failed = 0;

  for (const row of claimed) {
    const started = Date.now();
    try {
      const message = await buildMessageForRow(row, loadOrder);
      if (!message) {
        await runTx((tx) =>
          markOutboxFailed(tx, {
            id: row.id,
            attemptCount: row.attemptCount + 1,
            errorCode: "TEMPLATE_UNSUPPORTED",
            safeError: "Unsupported outbox event type or missing order.",
          }),
        );
        failed += 1;
        continue;
      }

      const result = await delivery.send({
        ...message,
        idempotencyKey: row.dedupeKey ?? row.id,
      });

      const nextAttempt = row.attemptCount + 1;

      if (result.ok) {
        await runTx((tx) =>
          markOutboxSent(tx, {
            id: row.id,
            providerMessageId: result.providerMessageId,
          }),
        );
        sent += 1;
        logger.info("outbox.sent", {
          outboxId: row.id,
          eventType: row.eventType,
          workerId,
          attemptNumber: nextAttempt,
          to: maskEmail(message.to),
          durationMs: Date.now() - started,
        });
        continue;
      }

      if (!result.retryable || nextAttempt >= row.maxAttempts) {
        await runTx((tx) =>
          markOutboxFailed(tx, {
            id: row.id,
            attemptCount: nextAttempt,
            errorCode: result.errorCode,
            safeError: result.safeMessage,
          }),
        );
        failed += 1;
        continue;
      }

      const delay = computeOutboxBackoffMs({
        attemptNumber: nextAttempt,
        jitterRatio: 0.1,
      });
      await runTx((tx) =>
        markOutboxRetry(tx, {
          id: row.id,
          attemptCount: nextAttempt,
          availableAt: new Date(Date.now() + delay),
          errorCode: result.errorCode,
          safeError: result.safeMessage,
        }),
      );
      retried += 1;
    } catch (error) {
      const nextAttempt = row.attemptCount + 1;
      const safeMessage =
        error instanceof Error ? error.name : "OUTBOX_PROCESS_ERROR";
      if (nextAttempt >= row.maxAttempts) {
        await runTx((tx) =>
          markOutboxFailed(tx, {
            id: row.id,
            attemptCount: nextAttempt,
            errorCode: "WORKER_EXCEPTION",
            safeError: safeMessage,
          }),
        );
        failed += 1;
      } else {
        const delay = computeOutboxBackoffMs({
          attemptNumber: nextAttempt,
          jitterRatio: 0.1,
        });
        await runTx((tx) =>
          markOutboxRetry(tx, {
            id: row.id,
            attemptCount: nextAttempt,
            availableAt: new Date(Date.now() + delay),
            errorCode: "WORKER_EXCEPTION",
            safeError: safeMessage,
          }),
        );
        retried += 1;
      }
    }
  }

  return {
    claimed: claimed.length,
    sent,
    retried,
    failed,
    workerId,
  };
}
