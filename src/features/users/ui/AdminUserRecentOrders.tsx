"use client";

import { useState, useTransition } from "react";

import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_BADGE,
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import { getAdminOrderDetailAction } from "@/features/orders/application/get-order-detail";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  adminOrderStatusLabel,
  adminPaymentStatusLabel,
} from "@/features/orders/ui/admin-order-status-labels";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";

export type AdminUserRecentOrderItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  baseCurrency: string;
};

type AdminUserRecentOrdersProps = {
  locale: string;
  orders: AdminUserRecentOrderItem[];
};

type AdminUserRecentOrderButtonProps = {
  order: AdminUserRecentOrderItem;
  onOpen: (orderNumber: string) => void;
};

function AdminUserRecentOrderButton({
  order,
  onOpen,
}: AdminUserRecentOrderButtonProps) {
  const dictionary = useAdminDictionary();

  return (
    <button
      type="button"
      onClick={() => onOpen(order.orderNumber)}
      aria-label={formatAdminMessage(dictionary.orders.list.openOrder, {
        orderNumber: order.orderNumber,
      })}
      className="block w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
    >
      <div className="flex flex-wrap items-center gap-2">
        <strong className="text-sm text-gray-900">{order.orderNumber}</strong>
        <span className={`${ADMIN_BADGE} ${orderStatusBadgeClass(order.status)}`}>
          {adminOrderStatusLabel(order.status, dictionary.orders.status)}
        </span>
        <span
          className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.paymentStatus)}`}
        >
          {adminPaymentStatusLabel(
            order.paymentStatus,
            dictionary.orders.paymentStatus,
          )}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        {order.totalAmount.toLocaleString("en-US")} {order.baseCurrency}
      </p>
    </button>
  );
}

/**
 * Recent-order list on the admin user page. Opens the same order sheet as `/admin/orders`.
 */
export function AdminUserRecentOrders({
  locale,
  orders,
}: AdminUserRecentOrdersProps) {
  const dictionary = useAdminDictionary();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openOrder(orderNumber: string): void {
    setDrawerOpen(true);
    setDetail(null);
    setError(null);

    startTransition(async () => {
      const result = await getAdminOrderDetailAction(locale, orderNumber);
      if (!result.ok) {
        setError(result.error.message);
        setDetail(null);
        return;
      }
      setDetail(result.value);
    });
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((order) => (
          <AdminUserRecentOrderButton
            key={order.id}
            order={order}
            onOpen={openOrder}
          />
        ))}
        {orders.length === 0 ? (
          <p className="text-sm text-gray-600">
            {dictionary.users.detail.noOrders}
          </p>
        ) : null}
      </div>
      <OrderDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        detail={detail}
        error={error}
        isLoading={isPending}
      />
    </>
  );
}
