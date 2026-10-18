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
  bonusEarnedAmount: number;
  bonusSpentAmount: number;
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

const CARD_BADGE = `${ADMIN_BADGE} uppercase tracking-wide`;

function AdminUserRecentOrderButton({
  order,
  onOpen,
}: AdminUserRecentOrderButtonProps) {
  const dictionary = useAdminDictionary();
  const earned = Math.max(0, Math.floor(order.bonusEarnedAmount));

  return (
    <button
      type="button"
      onClick={() => onOpen(order.orderNumber)}
      aria-label={formatAdminMessage(dictionary.orders.list.openOrder, {
        orderNumber: order.orderNumber,
      })}
      className="w-full max-w-[21rem] rounded-[16px] border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-3">
        <strong className="text-base font-bold text-gray-900">
          {order.orderNumber}
        </strong>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span
            className={`${CARD_BADGE} ${orderStatusBadgeClass(order.status)}`}
          >
            {adminOrderStatusLabel(order.status, dictionary.orders.status)}
          </span>
          <span
            className={`${CARD_BADGE} ${paymentStatusBadgeClass(order.paymentStatus)}`}
          >
            {adminPaymentStatusLabel(
              order.paymentStatus,
              dictionary.orders.paymentStatus,
            )}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-sm text-gray-500 tabular-nums">
          {order.totalAmount.toLocaleString("en-US")} {order.baseCurrency}
        </p>
        {earned > 0 ? (
          <p className="text-sm font-bold tabular-nums text-green-800">
            +{earned.toLocaleString("en-US")} ֏
          </p>
        ) : null}
      </div>
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
          <div className="flex flex-wrap gap-3">
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
