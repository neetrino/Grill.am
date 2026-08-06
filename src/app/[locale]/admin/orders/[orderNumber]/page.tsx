import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import {
  ADMIN_BADGE,
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import { getAdminOrderByNumber } from "@/features/orders/application/queries";
import {
  adminOrderStatusLabel,
  adminPaymentStatusLabel,
} from "@/features/orders/ui/admin-order-status-labels";
import { AdminPaymentAttemptsPanel } from "@/features/payments/ui/AdminPaymentAttemptsPanel";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminOrderDetailPageProps = {
  params: Promise<{ locale: string; orderNumber: string }>;
};

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    return values[key] ?? "";
  });
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { locale, orderNumber } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const admin = getDictionary(locale).admin;
  const copy = admin.orders;
  const detailCopy = copy.detail;
  const common = admin.common;

  const detail = await getAdminOrderByNumber(decodeURIComponent(orderNumber));
  if (!detail) {
    notFound();
  }

  const { order, items, events, payments } = detail;
  const address = order.shippingAddress;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`mb-1 ${ADMIN_PAGE_SUBTITLE}`}>
            <Link
              href={`/${locale}/admin/orders`}
              className="font-medium text-gray-700 hover:underline"
            >
              {copy.title}
            </Link>
          </p>
          <AdminPageTitle>{order.orderNumber}</AdminPageTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`${ADMIN_BADGE} ${orderStatusBadgeClass(order.status)}`}
            >
              {adminOrderStatusLabel(order.status, copy.status)}
            </span>
            <span
              className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.paymentStatus)}`}
            >
              {adminPaymentStatusLabel(order.paymentStatus, copy.paymentStatus)}
            </span>
            {order.isArchived ? (
              <span className={`${ADMIN_BADGE} bg-gray-100 text-gray-800`}>
                {detailCopy.archived}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className={`mb-3 ${ADMIN_SECTION_TITLE}`}>
            {detailCopy.customer}
          </h2>
          <p className="text-sm font-medium text-gray-900">{order.contactName}</p>
          <p className="text-sm text-gray-600">{order.contactEmail}</p>
          <p className="text-sm text-gray-600">{order.contactPhone}</p>
          <p className="mt-3 text-sm text-gray-600">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}
            {address.region ? `, ${address.region}` : ""}
            <br />
            {address.countryCode}
            {address.postalCode ? ` ${address.postalCode}` : ""}
          </p>
        </Card>

        <Card className="p-6">
          <h2 className={`mb-3 ${ADMIN_SECTION_TITLE}`}>
            {detailCopy.totals}
          </h2>
          <p className="text-sm text-gray-700">
            {detailCopy.subtotal}:{" "}
            {formatMoney(order.subtotalAmount, order.baseCurrency)}
          </p>
          <p className="text-sm text-gray-700">
            {detailCopy.delivery}
            {order.deliveryLabelSnapshot
              ? ` (${order.deliveryLabelSnapshot})`
              : ""}
            : {formatMoney(order.deliveryAmount, order.baseCurrency)}
          </p>
          <p className="text-sm text-gray-700">
            {detailCopy.couponDiscount}
            {order.promotionCodeSnapshot
              ? ` (${order.promotionCodeSnapshot})`
              : ""}
            : {formatMoney(order.discountAmount, order.baseCurrency)}
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {detailCopy.total}:{" "}
            {formatMoney(order.totalAmount, order.baseCurrency)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {fillTemplate(detailCopy.placedUtc, {
              datetime: order.placedAt
                .toISOString()
                .slice(0, 16)
                .replace("T", " "),
            })}
          </p>
        </Card>
      </div>

      <AdminPaymentAttemptsPanel
        locale={locale}
        orderNumber={order.orderNumber}
        orderId={order.id}
        orderStatus={order.status}
        paymentStatus={order.paymentStatus}
        sourceCartId={order.sourceCartId}
        contactName={order.contactName}
        contactEmail={order.contactEmail}
        contactPhone={order.contactPhone}
        payments={payments}
        events={events}
      />

      <Card className={`mb-6 ${ADMIN_TABLE_CARD}`}>
        <div className="border-b border-gray-200 px-4 py-3 sm:px-5">
          <h2 className={ADMIN_SECTION_TITLE}>{detailCopy.lineItems}</h2>
        </div>
        <div className={ADMIN_TABLE_OUTER_SCROLL}>
          <table className={ADMIN_TABLE}>
            <thead className={ADMIN_TABLE_THEAD}>
              <tr>
                <th className={ADMIN_TABLE_TH}>{detailCopy.product}</th>
                <th className={ADMIN_TABLE_TH}>{detailCopy.qty}</th>
                <th className={ADMIN_TABLE_TH}>{detailCopy.lineTotal}</th>
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_TBODY}>
              {items.map((item) => (
                <tr key={item.id} className={ADMIN_TABLE_ROW}>
                  <td className={ADMIN_TABLE_TD}>
                    <p className="font-medium text-gray-900">
                      {item.productTitleSnapshot}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.productSkuSnapshot}
                    </p>
                  </td>
                  <td className={ADMIN_TABLE_TD}>×{item.quantity}</td>
                  <td className={ADMIN_TABLE_TD}>
                    {formatMoney(item.lineTotalAmount, item.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className={`mb-4 ${ADMIN_SECTION_TITLE}`}>{detailCopy.history}</h2>
        <ol className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-gray-200 p-3 text-sm"
            >
              <p className="font-medium text-gray-900">
                {event.eventType}
                {event.fromState || event.toState
                  ? ` · ${event.fromState ?? common.dash} → ${event.toState ?? common.dash}`
                  : null}
              </p>
              <p className="text-gray-500">
                {event.createdAt.toISOString().slice(0, 19).replace("T", " ")}{" "}
                {common.utc}
                {event.isCustomerVisible
                  ? ` · ${detailCopy.customerVisible}`
                  : ` · ${detailCopy.internal}`}
              </p>
              {event.payload &&
              typeof event.payload === "object" &&
              "note" in event.payload &&
              typeof event.payload.note === "string" ? (
                <p className="mt-1 text-gray-700">{event.payload.note}</p>
              ) : null}
            </li>
          ))}
          {events.length === 0 ? (
            <li className="text-sm text-gray-600">{detailCopy.noEvents}</li>
          ) : null}
        </ol>
      </Card>
    </section>
  );
}
