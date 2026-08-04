"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  ORDER_DETAIL_CARD,
  ORDER_DETAIL_SECTION_TITLE,
} from "@/features/orders/ui/order-detail-card-classes";
import { formatOrderDrawerMoney } from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerItemsProps = {
  detail: AdminOrderDetailView;
};

/** Product list card — line items with modifiers, SKU, and qty × price. */
export function OrderDetailsDrawerItems({
  detail,
}: OrderDetailsDrawerItemsProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;

  return (
    <section className={ORDER_DETAIL_CARD}>
      <h3 className={ORDER_DETAIL_SECTION_TITLE}>{drawer.itemsSection}</h3>
      <ul className="space-y-5">
        {detail.items.map((item) => {
          const unit = formatOrderDrawerMoney(
            item.unitPriceAmount,
            item.currency,
          );
          const line = formatOrderDrawerMoney(
            item.lineTotalAmount,
            item.currency,
          );

          return (
            <li key={item.id} className="min-w-0">
              <p className="text-base font-semibold text-gray-900">
                {item.title}
              </p>

              {item.modifierLines.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  {item.modifierLines.map((lineLabel) => (
                    <li key={lineLabel}>{lineLabel}</li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-2 text-sm text-gray-500">
                {drawer.sku}: {item.sku}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {drawer.qty}: {item.quantity} × {unit} = {line}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
