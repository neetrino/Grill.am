import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import { ArcaPaymentActions } from "@/features/checkout/ui/ArcaPaymentActions";
import { IdramPaymentActions } from "@/features/checkout/ui/IdramPaymentActions";
import {
  CheckoutSuccessView,
  type CheckoutSuccessVariant,
} from "@/features/checkout/ui/CheckoutSuccessView";
import { PaymentStatusPoller } from "@/features/checkout/ui/PaymentStatusPoller";
import {
  orderAccessCookieName,
  verifyGuestOrderAccessToken,
} from "@/features/payments/domain/order-access-token";
import {
  getPaymentPresentationState,
  resolvePresentationWithUxHint,
} from "@/features/payments/presentation/get-payment-presentation-state";
import type { PaymentPresentationState } from "@/features/payments/presentation/payment-presentation-state";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultCurrency, isCurrency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

type SuccessPageProps = {
  params: Promise<{ locale: string; orderNumber: string }>;
  searchParams: Promise<{ state?: string }>;
};

export const dynamic = "force-dynamic";

function isProviderInitialized(metadata: Record<string, unknown> | null): boolean {
  if (!metadata) return false;
  if (metadata.formUrl || metadata.initializedAt || metadata.registeredAt) {
    return true;
  }
  if (metadata.initializationState === "ready") return true;
  // ARCA stores formUrl / initializationState under metadata.arca.
  const arca = metadata.arca;
  if (arca && typeof arca === "object") {
    const nested = arca as Record<string, unknown>;
    if (typeof nested.formUrl === "string" && nested.formUrl.length > 0) {
      return true;
    }
    if (nested.initializationState === "registered") {
      return true;
    }
  }
  return false;
}

function isAttemptExpired(
  expiresAt: Date | null | undefined,
  status: string | null | undefined,
  now: Date,
): boolean {
  if (!expiresAt) return false;
  if (
    status !== "PENDING" &&
    status !== "AUTHORIZED" &&
    status !== "CANCELLED"
  ) {
    return false;
  }
  return expiresAt.getTime() < now.getTime();
}

function mapVariant(
  state: PaymentPresentationState,
): CheckoutSuccessVariant {
  if (state === "captured") return "paid";
  if (state === "cod_pending") return "cod_placed";
  return "pending";
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { locale, orderNumber } = await params;
  const { state: rawState } = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const successCopy = dictionary.checkout.success;
  const user = await getCurrentUser();
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) {
    notFound();
  }

  const isOwner = Boolean(user && order.userId && order.userId === user.id);
  const isStaff = user?.role === "ADMIN" || user?.role === "OPERATOR";

  if (order.userId) {
    if (!isOwner && !isStaff) {
      notFound();
    }
  } else {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(orderAccessCookieName(order.orderNumber))
      ?.value;
    const tokenOk = verifyGuestOrderAccessToken(
      rawToken ?? "",
      order.guestAccessTokenHash,
      order.guestAccessExpiresAt,
    );
    if (!tokenOk && !isStaff) {
      notFound();
    }
  }

  const paymentRows = await getDb()
    .select()
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .orderBy(desc(payments.attemptNumber));

  const latestPayment = paymentRows[0] ?? null;
  const capturedExists = paymentRows.some((row) => row.status === "CAPTURED");
  const attemptExpired = isAttemptExpired(
    latestPayment?.expiresAt,
    latestPayment?.status,
    new Date(),
  );

  const presentation = resolvePresentationWithUxHint(
    getPaymentPresentationState({
      paymentMethod: latestPayment?.method ?? order.paymentStatus,
      provider: latestPayment?.provider ?? null,
      orderStatus: order.status,
      orderPaymentStatus: order.paymentStatus,
      latestAttemptStatus: latestPayment?.status ?? null,
      capturedExists,
      providerInitialized: isProviderInitialized(
        latestPayment?.metadata ?? null,
      ),
      attemptExpired,
      providerUnavailable: false,
    }),
    rawState ?? null,
  );

  const state = presentation.state;
  const isArca = latestPayment?.provider === "arca";
  const isIdram = latestPayment?.provider === "idram";

  let title = successCopy.title;
  let titleLead = successCopy.titleLead;
  let titleAccent = successCopy.titleAccent;
  let body = successCopy.bodyPaid;
  let emailNote = successCopy.emailNote;
  let arcaActionsMode: "recheck" | "retry" | "both" | null = null;
  let showIdramActions = false;
  let pollEnabled = false;

  switch (state) {
    case "cod_pending":
      body = successCopy.bodyCod;
      break;
    case "captured":
      body = successCopy.bodyPaid;
      break;
    case "requires_review":
      title = successCopy.reviewTitle;
      titleLead = successCopy.reviewTitleLead;
      titleAccent = successCopy.reviewTitleAccent;
      body = successCopy.bodyReview;
      emailNote = successCopy.reviewEmailNote ?? successCopy.pendingEmailNote;
      break;
    case "failed":
      title = successCopy.failedTitle;
      titleLead = successCopy.failedTitleLead;
      titleAccent = successCopy.failedTitleAccent;
      body = successCopy.bodyFailed;
      emailNote = successCopy.pendingEmailNote;
      if (isArca) arcaActionsMode = "retry";
      if (isIdram) showIdramActions = true;
      break;
    case "cancelled":
      title = successCopy.cancelledTitle;
      titleLead = successCopy.cancelledTitleLead;
      titleAccent = successCopy.cancelledTitleAccent;
      body = successCopy.bodyCancelled;
      emailNote = successCopy.pendingEmailNote;
      if (isArca) arcaActionsMode = "retry";
      if (isIdram) showIdramActions = true;
      break;
    case "expired":
      title = successCopy.expiredTitle ?? successCopy.cancelledTitle;
      titleLead = successCopy.expiredTitleLead ?? successCopy.cancelledTitleLead;
      titleAccent =
        successCopy.expiredTitleAccent ?? successCopy.cancelledTitleAccent;
      body = successCopy.bodyExpired ?? successCopy.bodyCancelled;
      emailNote = successCopy.pendingEmailNote;
      if (isArca) arcaActionsMode = "retry";
      if (isIdram) showIdramActions = true;
      break;
    case "authorized":
    case "awaiting_provider":
    case "processing":
    case "redirect_required":
      title = successCopy.pendingTitle;
      titleLead = successCopy.pendingTitleLead;
      titleAccent = successCopy.pendingTitleAccent;
      body = successCopy.bodyPending;
      emailNote = successCopy.pendingEmailNote;
      pollEnabled = true;
      if (isArca) arcaActionsMode = "both";
      if (isIdram) showIdramActions = true;
      break;
    case "unavailable":
      title = successCopy.pendingTitle;
      titleLead = successCopy.pendingTitleLead;
      titleAccent = successCopy.pendingTitleAccent;
      body = successCopy.bodyPending;
      emailNote = successCopy.pendingEmailNote;
      if (isArca) arcaActionsMode = "retry";
      if (isIdram) showIdramActions = true;
      break;
    default:
      body = successCopy.bodyPending;
      emailNote = successCopy.pendingEmailNote;
  }

  const currency = isCurrency(order.baseCurrency)
    ? order.baseCurrency
    : defaultCurrency;
  const totalFormatted = formatMoneyAmount(
    order.totalAmount,
    currency,
    locale,
  );

  return (
    <CheckoutSuccessView
      orderNumber={order.orderNumber}
      totalFormatted={totalFormatted}
      productsHref={`/${locale}/products`}
      ordersHref={user ? `/${locale}/profile/orders` : null}
      copy={{
        title,
        titleLead,
        titleAccent,
        body,
        orderNumberLabel: successCopy.orderNumberLabel,
        totalLabel: successCopy.totalLabel,
        continueShopping: successCopy.continueShopping,
        viewOrders: successCopy.viewOrders,
        emailNote,
      }}
      variant={mapVariant(state)}
      footer={
        <>
          <PaymentStatusPoller
            enabled={pollEnabled}
            checkingLabel={
              successCopy.bodyChecking ?? successCopy.rechecking
            }
            manualCheckLabel={
              successCopy.checkStatusManual ?? successCopy.refreshStatus
            }
          />
          {arcaActionsMode && latestPayment ? (
            <ArcaPaymentActions
              locale={locale}
              orderId={order.id}
              orderNumber={order.orderNumber}
              paymentId={latestPayment.id}
              mode={arcaActionsMode}
              labels={{
                recheckPayment: successCopy.recheckPayment,
                rechecking: successCopy.rechecking,
                retryPayment: successCopy.retryPayment,
                retrying: successCopy.retrying,
                verificationUnavailable: successCopy.verificationUnavailable,
                providerUnavailable: successCopy.providerUnavailable,
              }}
            />
          ) : showIdramActions ? (
            <IdramPaymentActions
              locale={locale}
              orderId={order.id}
              orderNumber={order.orderNumber}
              labels={{
                retryPayment: successCopy.retryPayment,
                retrying: successCopy.retrying,
                providerUnavailable: successCopy.idramProviderUnavailable,
                redirecting: successCopy.bodyRedirecting,
                submitFallback: successCopy.idramSubmitFallback,
                refreshStatus: successCopy.refreshStatus,
              }}
            />
          ) : null}
        </>
      }
    />
  );
}
