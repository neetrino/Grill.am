"use client";

import { useState, useTransition } from "react";

import { AdminDictionaryProvider } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { getCustomerOrderDetailAction } from "@/features/orders/application/get-customer-order-detail";
import { reorderCustomerOrderAction } from "@/features/orders/application/reorder-order";
import { CustomerOrdersCards } from "@/features/orders/ui/CustomerOrdersCards";
import { CustomerOrdersTable } from "@/features/orders/ui/CustomerOrdersTable";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import type { Locale } from "@/lib/i18n/config";
import type { AdminDictionary, ProfileDictionary } from "@/lib/i18n/get-dictionary";

type CustomerOrdersViewOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
  itemsCount: number;
};

type CustomerOrdersViewProps = {
  locale: string;
  orders: CustomerOrdersViewOrder[];
  /** Order drawer copy (shared with admin order detail UI). */
  dictionary: AdminDictionary;
  profileCopy: Pick<
    ProfileDictionary,
    | "reorder"
    | "reordering"
    | "reorderUnavailable"
    | "orderNumber"
    | "item"
    | "items"
    | "placedOn"
    | "viewDetails"
    | "noOrders"
    | "startShopping"
  >;
  /**
   * `responsive` — cards below `lg`, table from `lg` up (orders page).
   * `cards` — always cards (mobile profile sheet).
   */
  layout?: "responsive" | "cards";
};

export function CustomerOrdersView({
  locale,
  orders,
  dictionary,
  profileCopy,
  layout = "responsive",
}: CustomerOrdersViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isReordering, startReorderTransition] = useTransition();

  const cardLabels = {
    orderNumber: profileCopy.orderNumber,
    item: profileCopy.item,
    items: profileCopy.items,
    placedOn: profileCopy.placedOn,
    viewDetails: profileCopy.viewDetails,
    noOrders: profileCopy.noOrders,
    startShopping: profileCopy.startShopping,
  };

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

  const cards = (
    <CustomerOrdersCards
      locale={locale as Locale}
      orders={orders}
      labels={cardLabels}
      onOpenOrder={openOrder}
    />
  );

  return (
    <>
      {layout === "cards" ? (
        cards
      ) : (
        <>
          <div className="lg:hidden">{cards}</div>
          <div className="hidden lg:block">
            <CustomerOrdersTable orders={orders} onOpenOrder={openOrder} />
          </div>
        </>
      )}
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
