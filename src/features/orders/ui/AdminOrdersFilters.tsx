"use client";

import { Card } from "@/components/ui/Card";
import type { OrderStatus } from "@/features/orders/domain/order-status";
import type { PaymentStatus } from "@/features/orders/domain/payment-status";

const FILTER_CONTROL =
  "rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

/** Admin list filter options (labels) mapped to stored enum values. */
const ORDER_STATUS_FILTERS = [
  { label: "pending", value: "PENDING" },
  { label: "processing", value: "PROCESSING" },
  { label: "completed", value: "DELIVERED" },
  { label: "cancelled", value: "CANCELLED" },
] as const satisfies ReadonlyArray<{ label: string; value: OrderStatus }>;

const PAYMENT_STATUS_FILTERS = [
  { label: "paid", value: "CAPTURED" },
  { label: "pending", value: "PENDING" },
  { label: "failed", value: "FAILED" },
] as const satisfies ReadonlyArray<{ label: string; value: PaymentStatus }>;

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
          aria-label="Order status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="paymentStatus"
          defaultValue={paymentStatus ?? ""}
          className={`${FILTER_CONTROL} w-[180px] shrink-0`}
          aria-label="Payment status"
        >
          <option value="">All payment statuses</option>
          {PAYMENT_STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by order #, customer, email, phone…"
          className={`${FILTER_CONTROL} min-w-0 flex-1`}
          aria-label="Search orders"
        />
      </form>
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-sm text-gray-600">Total orders: {total}</p>
      </div>
    </Card>
  );
}
