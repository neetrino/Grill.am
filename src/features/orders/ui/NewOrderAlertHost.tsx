"use client";

import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_BTN_PRIMARY_CLASS,
  ADMIN_CARD_RADIUS_CLASS,
} from "@/features/admin/ui/admin-ui";
import { formatPaymentMethodDisplay } from "@/features/orders/domain/payment-method-label";
import { useNewOrderAlert } from "@/features/orders/ui/useNewOrderAlert";
import { formatAppDateTimeMinutes } from "@/lib/datetime/app-timezone";

type NewOrderAlertHostProps = {
  locale: string;
};

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

/**
 * Admin-shell host: fullscreen overlay + looping sound for unacknowledged new orders.
 */
export function NewOrderAlertHost({ locale }: NewOrderAlertHostProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.orders.alert;
  const {
    current,
    remainingCount,
    audioBlocked,
    acknowledgeCurrent,
    unlockAudio,
  } = useNewOrderAlert({ locale });

  if (!current) {
    return null;
  }

  const title =
    remainingCount > 1
      ? formatAdminMessage(copy.titleWithCount, {
          remaining: String(remainingCount),
        })
      : copy.title;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="new-order-alert-title"
      aria-describedby="new-order-alert-body"
      onPointerDown={unlockAudio}
    >
      <div
        className={`w-full max-w-lg border border-gray-200 bg-white p-6 shadow-xl sm:p-8 ${ADMIN_CARD_RADIUS_CLASS}`}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">
          {title}
        </p>
        <h2
          id="new-order-alert-title"
          className="mt-2 text-3xl font-bold text-gray-900"
        >
          {formatAdminMessage(copy.orderNumber, {
            orderNumber: current.orderNumber,
          })}
        </h2>

        <dl
          id="new-order-alert-body"
          className="mt-6 space-y-3 text-sm text-gray-800"
        >
          <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
            <dt className="text-gray-500">{copy.customer}</dt>
            <dd className="text-right font-medium">{current.contactName}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
            <dt className="text-gray-500">{copy.total}</dt>
            <dd className="text-right font-semibold">
              {formatMoney(current.totalAmount, current.baseCurrency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
            <dt className="text-gray-500">{copy.payment}</dt>
            <dd className="text-right font-medium">
              {formatPaymentMethodDisplay(current.paymentMethod)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">{copy.placedAt}</dt>
            <dd className="text-right font-medium">
              {formatAppDateTimeMinutes(current.placedAt)}
            </dd>
          </div>
        </dl>

        {audioBlocked ? (
          <p className="mt-4 rounded-[12px] bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {copy.audioBlocked}
          </p>
        ) : null}

        <button
          type="button"
          className={`${ADMIN_BTN_PRIMARY_CLASS} mt-6 w-full text-base`}
          onClick={acknowledgeCurrent}
          autoFocus
        >
          {copy.acknowledge}
        </button>
      </div>
    </div>
  );
}
