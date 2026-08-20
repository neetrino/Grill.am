"use client";

import { ClipboardList } from "lucide-react";

import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminSectionCard } from "@/features/admin/ui/AdminSectionCard";
import {
  ADMIN_BADGE,
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import {
  adminOrderStatusLabel,
  adminPaymentStatusLabel,
} from "@/features/orders/ui/admin-order-status-labels";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import { useAdminOrderDrawer } from "@/features/orders/ui/useAdminOrderDrawer";

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
      className="rounded-[15px] border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
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
 * Recent-order grid on the admin user page. Opens the same order sheet as `/admin/orders`.
 */
export function AdminUserRecentOrders({
  locale,
  orders,
}: AdminUserRecentOrdersProps) {
  const dictionary = useAdminDictionary();
  const drawer = useAdminOrderDrawer(locale);

  return (
    <>
      <AdminSectionCard
        icon={<ClipboardList className="h-5 w-5" />}
        title={dictionary.users.detail.recentOrders}
      >
        {orders.length === 0 ? (
          <p className="text-sm text-gray-600">
            {dictionary.users.detail.noOrders}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <AdminUserRecentOrderButton
                key={order.id}
                order={order}
                onOpen={drawer.openOrder}
              />
            ))}
          </div>
        )}
      </AdminSectionCard>
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
    </>
  );
}
