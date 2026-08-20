"use client";

import Link from "next/link";

import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HOVER_CLASS,
} from "@/features/admin/ui/admin-ui";
import {
  ADMIN_BADGE,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import { useAdminOrderDrawer } from "@/features/orders/ui/useAdminOrderDrawer";
import { formatMoneyAmount } from "@/lib/money/format";

export type DashboardRecentOrderItem = {
  id: string;
  orderNumber: string;
  status: string;
  contactEmail: string;
  totalAmount: number;
};

type DashboardRecentOrdersProps = {
  locale: string;
  orders: DashboardRecentOrderItem[];
};

type DashboardRecentOrderButtonProps = {
  locale: string;
  order: DashboardRecentOrderItem;
  onOpen: (orderNumber: string) => void;
};

function DashboardRecentOrderButton({
  locale,
  order,
  onOpen,
}: DashboardRecentOrderButtonProps) {
  const dictionary = useAdminDictionary();

  return (
    <button
      type="button"
      onClick={() => onOpen(order.orderNumber)}
      aria-label={formatAdminMessage(dictionary.orders.list.openOrder, {
        orderNumber: order.orderNumber,
      })}
      className={`block w-full rounded-[12px] px-3 py-2 text-left ring-1 ring-gray-100/80 ${ADMIN_CARD_HOVER_CLASS}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-gray-900">
              #{order.orderNumber}
            </p>
            <span
              className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.status)}`}
            >
              {order.status}
            </span>
          </div>
          <p className="truncate text-[11px] text-gray-500">
            {order.contactEmail}
          </p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-gray-900">
          {formatMoneyAmount(order.totalAmount, "AMD", locale)}
        </p>
      </div>
    </button>
  );
}

/**
 * Dashboard recent-order list. Opens the same order sheet as `/admin/orders`.
 */
export function DashboardRecentOrders({
  locale,
  orders,
}: DashboardRecentOrdersProps) {
  const copy = useAdminDictionary().dashboard;
  const drawer = useAdminOrderDrawer(locale);

  return (
    <div className={`${ADMIN_CARD_CLASS} p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          {copy.recentOrders}
        </h2>
        <Link
          href={`/${locale}/admin/orders`}
          className="rounded-[12px] px-2 py-1 text-xs font-medium text-brand-red hover:bg-brand-red/5"
        >
          {copy.viewAll}
        </Link>
      </div>
      <div className="space-y-2">
        {orders.map((order) => (
          <DashboardRecentOrderButton
            key={order.id}
            locale={locale}
            order={order}
            onOpen={drawer.openOrder}
          />
        ))}
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-600">
            {copy.noRecentOrders}
          </p>
        ) : null}
      </div>
      <OrderDetailsDrawer
        open={drawer.open}
        onClose={drawer.closeDrawer}
        detail={drawer.detail}
        error={drawer.error}
        isLoading={drawer.isLoading}
        adminControls={{
          locale,
          onStatusUpdated: drawer.refreshOpenOrder,
        }}
      />
    </div>
  );
}
