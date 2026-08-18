import "server-only";

import { eq } from "drizzle-orm";

import { getEnv } from "@/config/env";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { renderAdminOrderEmail } from "@/features/notifications/templates/admin-order-email-template";
import {
  renderCustomerCodOrderCreatedEmail,
  renderCustomerPaymentCapturedEmail,
  renderCustomerPaymentFailedEmail,
  renderCustomerReviewEmail,
} from "@/features/notifications/templates/customer-order-email-template";
import {
  renderReviewOperatorEmail,
  type PaymentEmailTemplateInput,
} from "@/features/notifications/templates/payment-email-templates";
import { getAdminOrderById } from "@/features/orders/application/queries";
import { toAdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { getStoreIdentity } from "@/features/settings/application/queries";
import type { EmailDeliveryProvider } from "@/lib/email/delivery";
import { getEmailDelivery } from "@/lib/email/get-email-delivery";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { defaultCurrency, isCurrency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";
import { logger } from "@/lib/observability/logger";

export const ORDER_EMAIL_KINDS = [
  "cod_created",
  "payment_captured",
  "payment_failed",
  "payment_cancelled",
  "requires_review",
] as const;

export type OrderEmailKind = (typeof ORDER_EMAIL_KINDS)[number];

export type SendOrderEmailsInput = {
  kind: OrderEmailKind;
  orderId: string;
  orderNumber: string;
  locale: string;
  /** Used for idempotency keys / logging. */
  paymentId?: string;
};

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type SendOrderEmailsResult = {
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
};

function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at <= 1) return "***";
  return `${value.slice(0, 1)}***${value.slice(at)}`;
}

/** Prefer ADMIN_EMAIL, then OPS_ALERT_EMAIL for operator destinations. */
export function resolveOperatorEmail(): string | undefined {
  const adminEmail = getEnv().ADMIN_EMAIL?.trim();
  if (adminEmail) {
    return adminEmail;
  }
  const opsAlert = process.env.OPS_ALERT_EMAIL?.trim();
  return opsAlert || undefined;
}

function resolveLocale(localeRaw: string): Locale {
  return isLocale(localeRaw) ? localeRaw : "en";
}

async function loadOrder(orderId: string): Promise<typeof orders.$inferSelect | null> {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return order ?? null;
}

async function buildAdminOrderMessage(
  orderId: string,
  orderNumber: string,
  locale: Locale,
): Promise<EmailMessage | null> {
  const to = resolveOperatorEmail();
  if (!to) {
    logger.warn("order_email.admin.missing_recipient", { orderId, orderNumber });
    return null;
  }

  const detail = await getAdminOrderById(orderId);
  if (!detail) {
    logger.warn("order_email.admin.missing_order", { orderId, orderNumber });
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
    idempotencyKey: `admin-order:${orderId}`,
  };
}

async function buildCustomerMessage(
  kind: OrderEmailKind,
  order: typeof orders.$inferSelect,
  locale: Locale,
  paymentId: string | undefined,
): Promise<EmailMessage | null> {
  const recipient = order.contactEmail.trim();
  if (!recipient) {
    logger.info("order_email.customer.skipped_no_email", {
      orderId: order.id,
      kind,
    });
    return null;
  }

  const detail = await getAdminOrderById(order.id);
  if (!detail) {
    logger.warn("order_email.customer.missing_order", {
      orderId: order.id,
      kind,
    });
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

  const rendered =
    kind === "cod_created"
      ? renderCustomerCodOrderCreatedEmail(customerInput)
      : kind === "payment_captured"
        ? renderCustomerPaymentCapturedEmail(customerInput)
        : kind === "requires_review"
          ? renderCustomerReviewEmail(customerInput)
          : renderCustomerPaymentFailedEmail(customerInput);

  const idempotencyKey =
    kind === "cod_created"
      ? `cod-order-created:${order.id}:customer`
      : kind === "payment_captured"
        ? `payment-captured:${paymentId ?? order.id}:customer`
        : kind === "requires_review"
          ? `payment-review:${order.id}:customer`
          : `payment-${kind === "payment_failed" ? "failed" : "cancelled"}:${paymentId ?? order.id}:customer`;

  return {
    to: recipient,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    idempotencyKey,
  };
}

async function buildOperatorReviewMessage(
  order: typeof orders.$inferSelect,
  locale: Locale,
  orderNumber: string,
): Promise<EmailMessage | null> {
  const to = resolveOperatorEmail();
  if (!to) {
    logger.warn("order_email.review_operator.missing_recipient", {
      orderId: order.id,
      orderNumber,
    });
    return null;
  }

  const currency = isCurrency(order.baseCurrency)
    ? order.baseCurrency
    : defaultCurrency;
  const amountFormatted = formatMoneyAmount(order.totalAmount, currency, locale);
  const templateInput: PaymentEmailTemplateInput = {
    locale,
    orderNumber: orderNumber || order.orderNumber,
    amountFormatted,
    contactName: order.contactName,
  };
  const rendered = renderReviewOperatorEmail(templateInput);

  return {
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    idempotencyKey: `payment-review:${order.id}:operators`,
  };
}

async function buildMessagesForKind(
  input: SendOrderEmailsInput,
): Promise<EmailMessage[]> {
  const locale = resolveLocale(input.locale);
  const order = await loadOrder(input.orderId);
  if (!order) {
    logger.warn("order_email.missing_order", {
      orderId: input.orderId,
      kind: input.kind,
    });
    return [];
  }

  const messages: EmailMessage[] = [];

  switch (input.kind) {
    case "cod_created": {
      const customer = await buildCustomerMessage(
        input.kind,
        order,
        locale,
        input.paymentId,
      );
      if (customer) messages.push(customer);
      const admin = await buildAdminOrderMessage(
        input.orderId,
        input.orderNumber,
        locale,
      );
      if (admin) messages.push(admin);
      break;
    }
    case "payment_captured": {
      const customer = await buildCustomerMessage(
        input.kind,
        order,
        locale,
        input.paymentId,
      );
      if (customer) messages.push(customer);
      const admin = await buildAdminOrderMessage(
        input.orderId,
        input.orderNumber,
        locale,
      );
      if (admin) messages.push(admin);
      break;
    }
    case "payment_failed":
    case "payment_cancelled": {
      const customer = await buildCustomerMessage(
        input.kind,
        order,
        locale,
        input.paymentId,
      );
      if (customer) messages.push(customer);
      break;
    }
    case "requires_review": {
      const customer = await buildCustomerMessage(
        input.kind,
        order,
        locale,
        input.paymentId,
      );
      if (customer) messages.push(customer);
      const operator = await buildOperatorReviewMessage(
        order,
        locale,
        input.orderNumber,
      );
      if (operator) messages.push(operator);
      break;
    }
  }

  return messages;
}

/**
 * Loads order detail, renders templates, and sends via configured delivery.
 * Failures are logged; callers should not surface them to checkout responses.
 */
export async function sendOrderEmails(
  input: SendOrderEmailsInput,
  delivery: EmailDeliveryProvider = getEmailDelivery(),
): Promise<SendOrderEmailsResult> {
  const messages = await buildMessagesForKind(input);
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  if (messages.length === 0) {
    skipped += 1;
    return { attempted: 0, sent, skipped, failed };
  }

  for (const message of messages) {
    const started = Date.now();
    try {
      const result = await delivery.send(message);
      if (result.ok) {
        sent += 1;
        logger.info("order_email.sent", {
          kind: input.kind,
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          to: maskEmail(message.to),
          idempotencyKey: message.idempotencyKey,
          providerMessageId: result.providerMessageId,
          durationMs: Date.now() - started,
        });
        continue;
      }

      failed += 1;
      logger.error("order_email.send_rejected", {
        kind: input.kind,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        to: maskEmail(message.to),
        idempotencyKey: message.idempotencyKey,
        provider: delivery.name,
        errorCode: result.errorCode,
        safeMessage: result.safeMessage,
        retryable: result.retryable,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      failed += 1;
      logger.error("order_email.send_exception", {
        kind: input.kind,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        to: maskEmail(message.to),
        idempotencyKey: message.idempotencyKey,
        errorName: error instanceof Error ? error.name : "UNKNOWN",
        durationMs: Date.now() - started,
      });
    }
  }

  return {
    attempted: messages.length,
    sent,
    skipped,
    failed,
  };
}
