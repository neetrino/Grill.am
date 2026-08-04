"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { ADMIN_FILTER_INPUT } from "@/features/admin/ui/admin-form-classes";
import { CheckoutSelect } from "@/features/checkout/ui/CheckoutSelect";
import type { OrderStatus } from "@/features/orders/domain/order-status";
import type { PaymentStatus } from "@/features/orders/domain/payment-status";

const ORDER_STATUS_FILTERS = [
  { label: "All statuses", value: "" },
  { label: "pending", value: "PENDING" },
  { label: "processing", value: "PROCESSING" },
  { label: "completed", value: "DELIVERED" },
  { label: "cancelled", value: "CANCELLED" },
] as const satisfies ReadonlyArray<{ label: string; value: "" | OrderStatus }>;

const PAYMENT_STATUS_FILTERS = [
  { label: "All payment statuses", value: "" },
  { label: "paid", value: "CAPTURED" },
  { label: "pending", value: "PENDING" },
  { label: "failed", value: "FAILED" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: "" | PaymentStatus;
}>;

type CustomerOrdersFiltersProps = {
  total: number;
  status?: OrderStatus;
  paymentStatus?: string;
  q?: string;
};

export function CustomerOrdersFilters({
  total,
  status,
  paymentStatus,
  q,
}: CustomerOrdersFiltersProps) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState(status ?? "");
  const [paymentValue, setPaymentValue] = useState(paymentStatus ?? "");
  const [queryValue, setQueryValue] = useState(q ?? "");

  const pushFilters = useCallback(
    (next: { status: string; paymentStatus: string; q: string }) => {
      const params = new URLSearchParams();
      if (next.status) params.set("status", next.status);
      if (next.paymentStatus) params.set("paymentStatus", next.paymentStatus);
      if (next.q.trim()) params.set("q", next.q.trim());
      const query = params.toString();
      router.push(query ? `?${query}` : "?");
    },
    [router],
  );

  return (
    <Card className="mb-6 overflow-visible !rounded-[15px] shadow-none">
      <form
        method="get"
        className="flex flex-nowrap items-center gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          pushFilters({
            status: statusValue,
            paymentStatus: paymentValue,
            q: queryValue,
          });
        }}
      >
        <label className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 z-[1] -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" aria-hidden />
          </span>
          <input
            name="q"
            value={queryValue}
            onChange={(event) => setQueryValue(event.target.value)}
            placeholder="Search by order #"
            className={`${ADMIN_FILTER_INPUT} w-full min-w-0 pl-10`}
            aria-label="Search orders"
          />
        </label>
        <CheckoutSelect
          label="Order status"
          hideLabel
          fitContent
          placeholder="All statuses"
          options={ORDER_STATUS_FILTERS}
          value={statusValue}
          onChange={(value) => {
            setStatusValue(value);
            pushFilters({
              status: value,
              paymentStatus: paymentValue,
              q: queryValue,
            });
          }}
        />
        <CheckoutSelect
          label="Payment status"
          hideLabel
          fitContent
          placeholder="All payment statuses"
          options={PAYMENT_STATUS_FILTERS}
          value={paymentValue}
          onChange={(value) => {
            setPaymentValue(value);
            pushFilters({
              status: statusValue,
              paymentStatus: value,
              q: queryValue,
            });
          }}
        />
      </form>
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-sm text-gray-600">Total orders: {total}</p>
      </div>
    </Card>
  );
}
