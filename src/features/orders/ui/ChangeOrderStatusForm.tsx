"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_LABEL,
  ADMIN_SELECT,
  ADMIN_TEXTAREA,
} from "@/features/admin/ui/admin-form-classes";
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
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-600">{forms.terminalStatus}</p>
    );
  }

  return (
    <Card className="p-6">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const toStatus = String(formData.get("toStatus") ?? "");
          const noteRaw = String(formData.get("note") ?? "").trim();

          startTransition(async () => {
            setError(null);
            const result = await changeOrderStatusAction(locale, {
              orderNumber,
              toStatus: toStatus as OrderStatus,
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
        <label>
          <span className={ADMIN_LABEL}>{forms.newStatus}</span>
          <select
            name="toStatus"
            required
            className={ADMIN_SELECT}
            defaultValue={eligibleStatuses[0]}
            disabled={isPending}
          >
            {eligibleStatuses.map((status) => (
              <option key={status} value={status}>
                {adminOrderStatusLabel(status, dictionary.orders.status)}
              </option>
            ))}
          </select>
        </label>
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
