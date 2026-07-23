"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { formatOrderDrawerMoney } from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerItemsProps = {
  detail: AdminOrderDetailView;
};

export function OrderDetailsDrawerItems({
  detail,
}: OrderDetailsDrawerItemsProps) {
  const dictionary = useAdminDictionary();
  const drawer = dictionary.orders.drawer;

  return (
    <div className="px-6 py-5">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        {drawer.items}
      </h3>
      <div className={`${ADMIN_TABLE_OUTER_SCROLL} rounded-lg border border-gray-200`}>
        <table className={ADMIN_TABLE}>
          <thead className={ADMIN_TABLE_THEAD}>
            <tr>
              <th className={ADMIN_TABLE_TH}>{drawer.product}</th>
              <th className={ADMIN_TABLE_TH}>{drawer.sku}</th>
              <th className={ADMIN_TABLE_TH}>{drawer.qty}</th>
              <th className={ADMIN_TABLE_TH}>{drawer.price}</th>
              <th className={ADMIN_TABLE_TH}>{drawer.lineTotal}</th>
            </tr>
          </thead>
          <tbody className={ADMIN_TABLE_TBODY}>
            {detail.items.map((item) => (
              <tr key={item.id} className={ADMIN_TABLE_ROW}>
                <td className={ADMIN_TABLE_TD}>
                  <div className="flex items-center gap-3">
                    <ProductThumb
                      title={item.title}
                      imageUrl={item.imageUrl}
                    />
                    <span className="font-medium text-gray-900">
                      {item.title}
                    </span>
                  </div>
                </td>
                <td className={ADMIN_TABLE_TD}>{item.sku}</td>
                <td className={ADMIN_TABLE_TD}>{item.quantity}</td>
                <td className={ADMIN_TABLE_TD}>
                  {formatOrderDrawerMoney(item.unitPriceAmount, item.currency)}
                </td>
                <td className={ADMIN_TABLE_TD}>
                  {formatOrderDrawerMoney(item.lineTotalAmount, item.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductThumb({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string | null;
}) {
  if (!imageUrl) {
    return (
      <span
        className="h-10 w-10 shrink-0 rounded-md bg-gray-100"
        aria-hidden
      />
    );
  }

  return (
    // Admin/R2 hosts vary — native img avoids brittle next/image allowlists.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={title}
      className="h-10 w-10 shrink-0 rounded-md object-cover"
    />
  );
}
