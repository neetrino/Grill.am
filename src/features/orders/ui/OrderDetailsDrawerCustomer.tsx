"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  ORDER_DETAIL_CARD,
  ORDER_DETAIL_SECTION_TITLE,
} from "@/features/orders/ui/order-detail-card-classes";

type OrderDetailsDrawerCustomerProps = {
  detail: AdminOrderDetailView;
};

/** Customer contact + optional note — first blocks in the admin order sheet. */
export function OrderDetailsDrawerCustomer({
  detail,
}: OrderDetailsDrawerCustomerProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;

  return (
    <>
      <section className={ORDER_DETAIL_CARD}>
        <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.customer}</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-gray-500">{drawer.name}:</dt>
            <dd className="font-medium text-gray-900">{detail.contactName}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-gray-500">{drawer.phone}:</dt>
            <dd className="font-medium text-gray-900">{detail.contactPhone}</dd>
          </div>
          {detail.contactEmail.trim() ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-gray-500">{drawer.email}:</dt>
              <dd className="font-medium text-gray-900">
                {detail.contactEmail}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {detail.customerNote ? (
        <section className={ORDER_DETAIL_CARD}>
          <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.customerNote}</h3>
          <p className="whitespace-pre-wrap text-sm font-medium text-gray-900">
            {detail.customerNote}
          </p>
        </section>
      ) : null}
    </>
  );
}
