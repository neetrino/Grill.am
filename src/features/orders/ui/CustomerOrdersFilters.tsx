"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { ADMIN_FILTER_INPUT } from "@/features/admin/ui/admin-form-classes";
import { formatAdminMessage } from "@/features/admin/ui/format-admin-message";
import { CheckoutSelect } from "@/features/checkout/ui/CheckoutSelect";
import type { OrderStatus } from "@/features/orders/domain/order-status";
import type { PaymentStatus } from "@/features/orders/domain/payment-status";
import type { AdminDictionary, ProfileDictionary } from "@/lib/i18n/get-dictionary";

const ORDER_STATUS_FILTERS = [
  { statusKey: "pending", value: "PENDING" },
  { statusKey: "processing", value: "PROCESSING" },
  { statusKey: "confirmed", value: "CONFIRMED" },
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

type CustomerOrdersFiltersProps = {
  total: number;
  status?: OrderStatus;
  paymentStatus?: string;
  q?: string;
  copy: ProfileDictionary["ordersList"];
  statusLabels: AdminDictionary["orders"]["status"];
  paymentLabels: AdminDictionary["orders"]["paymentStatus"];
};

export function CustomerOrdersFilters({
  total,
  status,
  paymentStatus,
  q,
  copy,
  statusLabels,
  paymentLabels,
}: CustomerOrdersFiltersProps) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState(status ?? "");
  const [paymentValue, setPaymentValue] = useState(paymentStatus ?? "");
  const [queryValue, setQueryValue] = useState(q ?? "");

  const orderOptions = [
    { value: "", label: copy.allStatuses },
    ...ORDER_STATUS_FILTERS.map((option) => ({
      value: option.value,
      label: statusLabels[option.statusKey],
    })),
  ];

  const paymentOptions = [
    { value: "", label: copy.allPaymentStatuses },
    ...PAYMENT_STATUS_FILTERS.map((option) => ({
      value: option.value,
      label: paymentLabels[option.statusKey],
    })),
  ];

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
            placeholder={copy.searchPlaceholder}
            className={`${ADMIN_FILTER_INPUT} w-full min-w-0 pl-10`}
            aria-label={copy.searchAria}
          />
        </label>
        <CheckoutSelect
          label={copy.orderStatus}
          hideLabel
          fitContent
          placeholder={copy.allStatuses}
          options={orderOptions}
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
          label={copy.paymentStatus}
          hideLabel
          fitContent
          placeholder={copy.allPaymentStatuses}
          options={paymentOptions}
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
        <p className="text-sm text-gray-600">
          {formatAdminMessage(copy.totalOrders, { total: String(total) })}
        </p>
      </div>
    </Card>
  );
}
