"use client";

import { useState, useTransition } from "react";

import { AdminDictionaryProvider } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { getCustomerOrderDetailAction } from "@/features/orders/application/get-customer-order-detail";
import { reorderCustomerOrderAction } from "@/features/orders/application/reorder-order";
import { CustomerOrdersTable } from "@/features/orders/ui/CustomerOrdersTable";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import type { AdminDictionary, ProfileDictionary } from "@/lib/i18n/get-dictionary";

type CustomerOrdersViewOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
};

type CustomerOrdersViewProps = {
  locale: string;
  orders: CustomerOrdersViewOrder[];
  /** Order drawer copy (shared with admin order detail UI). */
  dictionary: AdminDictionary;
  profileCopy: Pick<
    ProfileDictionary,
    "reorder" | "reordering" | "reorderUnavailable"
  >;
};

export function CustomerOrdersView({
  locale,
  orders,
  dictionary,
  profileCopy,
}: CustomerOrdersViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isReordering, startReorderTransition] = useTransition();

  function openOrder(orderNumber: string): void {
    setDrawerOpen(true);
    setDetail(null);
    setError(null);
    setReorderError(null);

    startTransition(async () => {
      const result = await getCustomerOrderDetailAction(locale, orderNumber);
      if (!result.ok) {
        setError(result.error.message);
        setDetail(null);
        return;
      }
      setDetail(result.value);
    });
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setDetail(null);
    setError(null);
    setReorderError(null);
  }

  function handleReorder(): void {
    if (!detail || isReordering) return;
    setReorderError(null);

    startReorderTransition(async () => {
      const result = await reorderCustomerOrderAction(
        locale,
        detail.orderNumber,
      );
      // Success path redirects to checkout from the server action.
      if (!result.ok) {
        setReorderError(
          result.error.code === "NO_AVAILABLE_PRODUCTS"
            ? profileCopy.reorderUnavailable
            : result.error.message,
        );
      }
    });
  }

  return (
    <>
      <CustomerOrdersTable orders={orders} onOpenOrder={openOrder} />
      <AdminDictionaryProvider dictionary={dictionary}>
        <OrderDetailsDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          detail={detail}
          error={error}
          isLoading={isPending}
          reorder={{
            label: profileCopy.reorder,
            pendingLabel: profileCopy.reordering,
            onReorder: handleReorder,
            isPending: isReordering,
            error: reorderError,
          }}
        />
      </AdminDictionaryProvider>
    </>
  );
}
