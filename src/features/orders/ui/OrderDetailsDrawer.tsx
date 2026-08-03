"use client";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { OrderDetailsDrawerCustomizations } from "@/features/orders/ui/OrderDetailsDrawerCustomizations";
import { OrderDetailsDrawerItems } from "@/features/orders/ui/OrderDetailsDrawerItems";
import { OrderDetailsDrawerShipping } from "@/features/orders/ui/OrderDetailsDrawerShipping";
import { OrderDetailsDrawerSummary } from "@/features/orders/ui/OrderDetailsDrawerSummary";
import { OrderDetailsDrawerTotals } from "@/features/orders/ui/OrderDetailsDrawerTotals";

type OrderDetailsDrawerReorder = {
  label: string;
  pendingLabel: string;
  onReorder: () => void;
  isPending: boolean;
  error: string | null;
};

type OrderDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  detail: AdminOrderDetailView | null;
  error: string | null;
  isLoading: boolean;
  /** Customer-only reorder control in the drawer header. */
  reorder?: OrderDetailsDrawerReorder;
};

export function OrderDetailsDrawer({
  open,
  onClose,
  detail,
  error,
  isLoading,
  reorder,
}: OrderDetailsDrawerProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;
  const common = dictionary.common;

  const title = drawer.title;
  const subtitle = detail ? `#${detail.orderNumber}` : undefined;

  const headerActions =
    reorder && detail && !isLoading && !error ? (
      <Button
        type="button"
        size="sm"
        onClick={reorder.onReorder}
        disabled={reorder.isPending}
        className="w-full shrink-0 rounded-full bg-brand-red text-white hover:bg-brand-red-hot lg:w-auto"
      >
        {reorder.isPending ? reorder.pendingLabel : reorder.label}
      </Button>
    ) : null;

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      closeLabel={common.close}
      headerActions={headerActions}
    >
      {reorder?.error ? (
        <p className="mb-4 rounded-[15px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {reorder.error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="py-8 text-sm text-gray-600">{drawer.loading}</p>
      ) : null}
      {error ? <p className="py-8 text-sm text-red-700">{error}</p> : null}
      {!isLoading && !error && detail ? (
        <div className="space-y-4">
          <OrderDetailsDrawerSummary detail={detail} />
          <OrderDetailsDrawerShipping detail={detail} />
          <OrderDetailsDrawerTotals detail={detail} />
          <OrderDetailsDrawerItems detail={detail} />
          <OrderDetailsDrawerCustomizations detail={detail} />
        </div>
      ) : null}
    </SideSheet>
  );
}
