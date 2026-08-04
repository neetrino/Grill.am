"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  ORDER_DETAIL_CARD,
  ORDER_DETAIL_SECTION_TITLE,
} from "@/features/orders/ui/order-detail-card-classes";

type OrderDetailsDrawerCustomizationsProps = {
  detail: AdminOrderDetailView;
};

/**
 * Fallback block for line-item addons / exclusions when shown separately.
 * Prefer inline modifiers under each product in `OrderDetailsDrawerItems`.
 */
export function OrderDetailsDrawerCustomizations({
  detail,
}: OrderDetailsDrawerCustomizationsProps) {
  const dictionary = useAdminDictionary();
  const customized = detail.items.filter(
    (item) => item.modifierLines.length > 0,
  );

  if (customized.length === 0) {
    return null;
  }

  return (
    <section className={ORDER_DETAIL_CARD}>
      <h3 className={ORDER_DETAIL_SECTION_TITLE}>
        {dictionary.orders.drawer.customizations}
      </h3>
      <ul className="space-y-4">
        {customized.map((item) => (
          <li
            key={item.id}
            className="rounded-[15px] border border-gray-200 px-4 py-3"
          >
            <p className="text-sm font-medium text-gray-900">{item.title}</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {item.modifierLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
