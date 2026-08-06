"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Card } from "@/components/ui/Card";
import { ADMIN_FILTER_INPUT } from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import type { OrderStatus } from "@/features/orders/domain/order-status";
import type { PaymentStatus } from "@/features/orders/domain/payment-status";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

/** Admin list filter options mapped to stored enum values. */
const ORDER_STATUS_FILTERS = [
  { statusKey: "pending", value: "PENDING" },
  { statusKey: "processing", value: "PROCESSING" },
  { statusKey: "completed", value: "DELIVERED" },
  { statusKey: "cancelled", value: "CANCELLED" },
  { statusKey: "requiresReview", value: "REQUIRES_REVIEW" },
] as const satisfies ReadonlyArray<{
  statusKey: keyof AdminDictionary["orders"]["status"];
  value: OrderStatus;
}>;

const PAYMENT_STATUS_FILTERS = [
  { statusKey: "paid", value: "CAPTURED" },
  { statusKey: "pending", value: "PENDING" },
  { statusKey: "failed", value: "FAILED" },
  { statusKey: "cancelled", value: "CANCELLED" },
  { statusKey: "authorized", value: "AUTHORIZED" },
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
  const router = useRouter();
  const filters = dictionary.orders.filters;
  const statusLabels = dictionary.orders.status;
  const paymentLabels = dictionary.orders.paymentStatus;
  const [statusValue, setStatusValue] = useState(status ?? "");
  const [paymentValue, setPaymentValue] = useState(paymentStatus ?? "");
  const [queryValue, setQueryValue] = useState(q ?? "");

  const orderOptions = [
    { value: "", label: filters.allStatuses },
    ...ORDER_STATUS_FILTERS.map((option) => ({
      value: option.value,
      label: statusLabels[option.statusKey],
    })),
  ];

  const paymentOptions = [
    { value: "", label: filters.allPaymentStatuses },
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
    <Card
      className={`mb-6 overflow-visible !border-0 !shadow-none ${ADMIN_CARD_CLASS}`}
    >
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
        <AdminSelect
          label={filters.orderStatus}
          hideLabel
          fitContent
          placeholder={filters.allStatuses}
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
        <AdminSelect
          label={filters.paymentStatus}
          hideLabel
          fitContent
          placeholder={filters.allPaymentStatuses}
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
        <input
          name="q"
          value={queryValue}
          onChange={(event) => setQueryValue(event.target.value)}
          placeholder={filters.searchPlaceholder}
          className={`${ADMIN_FILTER_INPUT} min-w-0 flex-1`}
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
