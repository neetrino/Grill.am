"use client";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { OrderDetailsDrawerItems } from "@/features/orders/ui/OrderDetailsDrawerItems";
import { OrderDetailsDrawerShipping } from "@/features/orders/ui/OrderDetailsDrawerShipping";
import { OrderDetailsDrawerSummary } from "@/features/orders/ui/OrderDetailsDrawerSummary";
import { OrderDetailsDrawerTotals } from "@/features/orders/ui/OrderDetailsDrawerTotals";
import { formatOrderDrawerDate } from "@/features/orders/ui/order-drawer-format";

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
  const isCustomerSheet = Boolean(reorder);

  const title = detail
    ? `${drawer.orderNumber}${detail.orderNumber}`
    : drawer.title;
  const subtitle =
    detail != null
      ? drawer.placedOn.replace(
          "{date}",
          formatOrderDrawerDate(detail.placedAt),
        )
      : undefined;

  const headerActions =
    reorder && detail && !isLoading && !error ? (
      <Button
        type="button"
        size="sm"
        onClick={reorder.onReorder}
        disabled={reorder.isPending}
        className="!rounded-full w-full shrink-0 bg-brand-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-hot focus:ring-brand-red lg:w-auto"
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
      desktopWidthPercent={40}
      mobileMaxWidthClassName="max-w-2xl"
      panelClassName="!bg-brand-surface"
      headerClassName="!border-0 !bg-brand-surface"
      bodyClassName="!bg-brand-surface"
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
        <div className="space-y-3">
          <OrderDetailsDrawerSummary detail={detail} />
          <OrderDetailsDrawerItems detail={detail} />
          <OrderDetailsDrawerTotals detail={detail} />
          <OrderDetailsDrawerShipping
            detail={detail}
            compact={isCustomerSheet}
          />
        </div>
      ) : null}
    </SideSheet>
  );
}
