import {
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { Card } from "@/components/ui/Card";
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
import { toAdminPaymentAttemptViews } from "@/features/payments/presentation/payment-attempt-view";
import { ResolvePaymentReviewForm } from "@/features/payments/ui/ResolvePaymentReviewForm";
import { AdminPaymentActions } from "@/features/payments/ui/AdminPaymentActions";

type PaymentRow = {
  id: string;
  provider: string;
  method: string;
  status: string;
  attemptNumber: number;
  amount: number;
  currency: string;
  providerReference: string | null;
  providerOrderNumber: string | null;
  createdAt: Date;
  authorizedAt: Date | null;
  capturedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
};

type EventRow = {
  id: string;
  eventType: string;
  fromState: string | null;
  toState: string | null;
  createdAt: Date;
  isCustomerVisible: boolean;
  payload: Record<string, unknown> | null;
  correlationId: string | null;
};

type AdminPaymentAttemptsPanelProps = {
  locale: string;
  orderNumber: string;
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  sourceCartId: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  payments: PaymentRow[];
  events: EventRow[];
};

function formatTs(value: string | null): string {
  if (!value) return "—";
  return value.slice(0, 19).replace("T", " ");
}

function eventKind(payload: Record<string, unknown> | null): string {
  const kind = payload?.kind;
  return typeof kind === "string" ? kind : "—";
}

/**
 * Admin payment attempts + timeline + review resolution controls.
 */
export function AdminPaymentAttemptsPanel({
  locale,
  orderNumber,
  orderId,
  orderStatus,
  paymentStatus,
  sourceCartId,
  contactName,
  contactEmail,
  contactPhone,
  payments,
  events,
}: AdminPaymentAttemptsPanelProps) {
  const views = toAdminPaymentAttemptViews(payments, {
    sourceCartId,
    reviewReason:
      orderStatus === "REQUIRES_REVIEW"
        ? "Provider payment captured; fulfillment requires review"
        : null,
  });

  const paymentEvents = events.filter(
    (event) =>
      event.eventType === "PAYMENT_PROVIDER" ||
      (typeof event.payload?.kind === "string" &&
        String(event.payload.kind).startsWith("PAYMENT_")),
  );

  return (
    <div className="mb-6 space-y-6">
      {orderStatus === "REQUIRES_REVIEW" && paymentStatus === "CAPTURED" ? (
        <Card className="border border-amber-200 bg-amber-50 p-6">
          <h2 className={`mb-2 ${ADMIN_SECTION_TITLE}`}>Requires review</h2>
          <p className="mb-3 text-sm text-amber-950">
            Payment was received (CAPTURED). Fulfillment is blocked — allocate
            stock, confirm delayed fulfillment, cancel with external refund, or
            escalate to finance. Do not mark payment as failed.
          </p>
          <dl className="mb-4 grid gap-2 text-sm text-amber-950 sm:grid-cols-2">
            <div>
              <dt className="font-medium">Customer</dt>
              <dd>
                {contactName} · {contactPhone}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Email</dt>
              <dd>{contactEmail}</dd>
            </div>
          </dl>
          <ResolvePaymentReviewForm locale={locale} orderNumber={orderNumber} />
        </Card>
      ) : null}

      <Card className={ADMIN_TABLE_CARD}>
        <div className="border-b border-gray-200 px-4 py-3 sm:px-5">
          <h2 className={ADMIN_SECTION_TITLE}>Payment attempts</h2>
        </div>
        <div className={ADMIN_TABLE_OUTER_SCROLL}>
          <table className={ADMIN_TABLE}>
            <thead className={ADMIN_TABLE_THEAD}>
              <tr>
                <th className={ADMIN_TABLE_TH}>#</th>
                <th className={ADMIN_TABLE_TH}>Provider</th>
                <th className={ADMIN_TABLE_TH}>Status</th>
                <th className={ADMIN_TABLE_TH}>Amount</th>
                <th className={ADMIN_TABLE_TH}>Bill / order no.</th>
                <th className={ADMIN_TABLE_TH}>Ref suffix</th>
                <th className={ADMIN_TABLE_TH}>Created</th>
                <th className={ADMIN_TABLE_TH}>Expires</th>
                <th className={ADMIN_TABLE_TH}>Actions</th>
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_TBODY}>
              {views.length === 0 ? (
                <tr className={ADMIN_TABLE_ROW}>
                  <td className={ADMIN_TABLE_TD} colSpan={9}>
                    No payment attempts.
                  </td>
                </tr>
              ) : (
                views.map((view) => (
                  <tr key={view.paymentId} className={ADMIN_TABLE_ROW}>
                    <td className={ADMIN_TABLE_TD}>{view.attemptNumber}</td>
                    <td className={ADMIN_TABLE_TD}>{view.provider}</td>
                    <td className={ADMIN_TABLE_TD}>{view.status}</td>
                    <td className={ADMIN_TABLE_TD}>
                      {view.amount.toLocaleString("en-US")} {view.currency}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {view.providerOrderNumber ?? "—"}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {view.providerReferenceSuffix ?? "—"}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {formatTs(view.createdAt)}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {formatTs(view.expiresAt)}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <AdminPaymentActions
                        locale={locale}
                        orderId={orderId}
                        orderNumber={orderNumber}
                        paymentId={view.paymentId}
                        provider={view.provider}
                        status={view.status}
                        supportReference={`${orderNumber}#${view.attemptNumber}`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className={ADMIN_TABLE_CARD}>
        <div className="border-b border-gray-200 px-4 py-3 sm:px-5">
          <h2 className={ADMIN_SECTION_TITLE}>Payment event timeline</h2>
        </div>
        <div className={ADMIN_TABLE_OUTER_SCROLL}>
          <table className={ADMIN_TABLE}>
            <thead className={ADMIN_TABLE_THEAD}>
              <tr>
                <th className={ADMIN_TABLE_TH}>When (UTC)</th>
                <th className={ADMIN_TABLE_TH}>Type</th>
                <th className={ADMIN_TABLE_TH}>Kind</th>
                <th className={ADMIN_TABLE_TH}>From → To</th>
                <th className={ADMIN_TABLE_TH}>Correlation</th>
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_TBODY}>
              {paymentEvents.length === 0 ? (
                <tr className={ADMIN_TABLE_ROW}>
                  <td className={ADMIN_TABLE_TD} colSpan={5}>
                    No payment events.
                  </td>
                </tr>
              ) : (
                paymentEvents.map((event) => (
                  <tr key={event.id} className={ADMIN_TABLE_ROW}>
                    <td className={ADMIN_TABLE_TD}>
                      {event.createdAt
                        .toISOString()
                        .slice(0, 19)
                        .replace("T", " ")}
                    </td>
                    <td className={ADMIN_TABLE_TD}>{event.eventType}</td>
                    <td className={ADMIN_TABLE_TD}>
                      {eventKind(event.payload)}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {event.fromState ?? "—"} → {event.toState ?? "—"}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      {event.correlationId
                        ? `${event.correlationId.slice(0, 8)}…`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
