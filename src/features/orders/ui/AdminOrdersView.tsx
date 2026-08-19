"use client";

import { BulkChangeOrderStatusForm } from "@/features/orders/ui/BulkChangeOrderStatusForm";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import { useAdminOrderDrawer } from "@/features/orders/ui/useAdminOrderDrawer";

type AdminOrdersViewOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  latestPaymentMethod: string | null;
  contactName: string;
  contactEmail: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
  isArchived: boolean;
};

type AdminOrdersViewProps = {
  locale: string;
  orders: AdminOrdersViewOrder[];
};

export function AdminOrdersView({ locale, orders }: AdminOrdersViewProps) {
  const drawer = useAdminOrderDrawer(locale);

  return (
    <>
      <BulkChangeOrderStatusForm
        locale={locale}
        orders={orders}
        onOpenOrder={drawer.openOrder}
      />
      <OrderDetailsDrawer
        open={drawer.open}
        onClose={drawer.closeDrawer}
        detail={drawer.detail}
        error={drawer.error}
        isLoading={drawer.isLoading}
      />
    </>
  );
}
