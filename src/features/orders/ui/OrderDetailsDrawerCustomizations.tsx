"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";

type OrderDetailsDrawerCustomizationsProps = {
  detail: AdminOrderDetailView;
};

/** Separate block for line-item addons / exclusions / option choices. */
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
    <div className="border-t border-gray-200 px-6 py-5">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        {dictionary.orders.drawer.customizations}
      </h3>
      <ul className="space-y-4">
        {customized.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-gray-200 px-4 py-3"
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
    </div>
  );
}
