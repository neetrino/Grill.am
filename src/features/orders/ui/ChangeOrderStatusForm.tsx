"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_LABEL,
  ADMIN_TEXTAREA,
} from "@/features/admin/ui/admin-form-classes";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { changeOrderStatusAction } from "@/features/orders/application/change-order-status";
import type { OrderStatus } from "@/features/orders/domain/order-status";
import { adminOrderStatusLabel } from "@/features/orders/ui/admin-order-status-labels";

type ChangeOrderStatusFormProps = {
  locale: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  eligibleStatuses: OrderStatus[];
};

export function ChangeOrderStatusForm({
  locale,
  orderNumber,
  currentStatus,
  eligibleStatuses,
}: ChangeOrderStatusFormProps) {
  const dictionary = useAdminDictionary();
  const forms = dictionary.orders.forms;
  const common = dictionary.common;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [toStatus, setToStatus] = useState(eligibleStatuses[0] ?? "");
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-600">{forms.terminalStatus}</p>
    );
  }

  const statusOptions = eligibleStatuses.map((status) => ({
    value: status,
    label: adminOrderStatusLabel(status, dictionary.orders.status),
  }));

  return (
    <Card className={`overflow-visible !border-0 !shadow-none p-6 ${ADMIN_CARD_CLASS}`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextStatus = String(formData.get("toStatus") ?? "");
          const noteRaw = String(formData.get("note") ?? "").trim();

          startTransition(async () => {
            setError(null);
            const result = await changeOrderStatusAction(locale, {
              orderNumber,
              toStatus: nextStatus as OrderStatus,
              note: noteRaw.length > 0 ? noteRaw : undefined,
            });

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            router.refresh();
          });
        }}
      >
        <p className="text-sm text-gray-700">
          {forms.current}:{" "}
          <strong className="text-gray-900">
            {adminOrderStatusLabel(currentStatus, dictionary.orders.status)}
          </strong>
        </p>
        <AdminSelect
          name="toStatus"
          label={forms.newStatus}
          placeholder={forms.newStatus}
          required
          options={statusOptions}
          value={toStatus}
          disabled={isPending}
          onChange={setToStatus}
        />
        <label>
          <span className={ADMIN_LABEL}>{forms.noteOptional}</span>
          <textarea
            name="note"
            rows={2}
            maxLength={1000}
            className={ADMIN_TEXTAREA}
            disabled={isPending}
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? common.updating : forms.updateStatus}
        </Button>
      </form>
    </Card>
  );
}
