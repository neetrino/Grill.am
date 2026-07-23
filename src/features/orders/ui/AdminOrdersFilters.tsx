"use client";

import { Card } from "@/components/ui/Card";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import type { OrderStatus } from "@/features/orders/domain/order-status";
import type { PaymentStatus } from "@/features/orders/domain/payment-status";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

const FILTER_CONTROL =
  "rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

/** Admin list filter options mapped to stored enum values. */
const ORDER_STATUS_FILTERS = [
  { statusKey: "pending", value: "PENDING" },
  { statusKey: "processing", value: "PROCESSING" },
  { statusKey: "completed", value: "DELIVERED" },
  { statusKey: "cancelled", value: "CANCELLED" },
] as const satisfies ReadonlyArray<{
  statusKey: keyof AdminDictionary["orders"]["status"];
  value: OrderStatus;
}>;

const PAYMENT_STATUS_FILTERS = [
  { statusKey: "paid", value: "CAPTURED" },
  { statusKey: "pending", value: "PENDING" },
  { statusKey: "failed", value: "FAILED" },
] as const satisfies ReadonlyArray<{
  statusKey: keyof AdminDictionary["orders"]["paymentStatus"];
  value: PaymentStatus;
}>;

type AdminOrdersFiltersProps = {
  total: number;
  status?: OrderStatus;
  paymentStatus?: string;
  q?: string;
};

export function AdminOrdersFilters({
  total,
  status,
  paymentStatus,
  q,
}: AdminOrdersFiltersProps) {
  const dictionary = useAdminDictionary();
  const filters = dictionary.orders.filters;
  const statusLabels = dictionary.orders.status;
  const paymentLabels = dictionary.orders.paymentStatus;

  return (
    <Card className="mb-6 overflow-hidden">
      <form
        method="get"
        className="flex flex-nowrap items-center gap-3 p-4"
        onChange={(event) => {
          if (event.target instanceof HTMLSelectElement) {
            event.currentTarget.requestSubmit();
          }
        }}
      >
        <select
          name="status"
          defaultValue={status ?? ""}
          className={`${FILTER_CONTROL} w-[160px] shrink-0`}
          aria-label={filters.orderStatus}
        >
          <option value="">{filters.allStatuses}</option>
          {ORDER_STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {statusLabels[option.statusKey]}
            </option>
          ))}
        </select>
        <select
          name="paymentStatus"
          defaultValue={paymentStatus ?? ""}
          className={`${FILTER_CONTROL} w-[180px] shrink-0`}
          aria-label={filters.paymentStatus}
        >
          <option value="">{filters.allPaymentStatuses}</option>
          {PAYMENT_STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {paymentLabels[option.statusKey]}
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={filters.searchPlaceholder}
          className={`${FILTER_CONTROL} min-w-0 flex-1`}
          aria-label={filters.searchAria}
        />
      </form>
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-sm text-gray-600">
          {formatAdminMessage(filters.totalOrders, { total: String(total) })}
        </p>
      </div>
    </Card>
  );
}
