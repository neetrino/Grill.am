"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_LABEL,
  ADMIN_SELECT,
} from "@/features/admin/ui/admin-form-classes";
import { updateContactStatusAction } from "@/features/contact/application/update-contact-status";
import type { ContactStatus } from "@/features/contact/domain/contact-rules";

type UpdateContactStatusFormProps = {
  locale: string;
  messageId: string;
  currentStatus: ContactStatus;
  eligibleStatuses: ContactStatus[];
};

export function UpdateContactStatusForm({
  locale,
  messageId,
  currentStatus,
  eligibleStatuses,
}: UpdateContactStatusFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-600">No further status changes.</p>
    );
  }

  return (
    <Card className="p-6">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const status = String(formData.get("status") ?? "") as ContactStatus;

          startTransition(async () => {
            setError(null);
            const result = await updateContactStatusAction(locale, {
              messageId,
              status,
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
          Current: <strong className="text-gray-900">{currentStatus}</strong>
        </p>
        <label>
          <span className={ADMIN_LABEL}>New status</span>
          <select
            name="status"
            required
            className={ADMIN_SELECT}
            defaultValue={eligibleStatuses[0]}
            disabled={isPending}
          >
            {eligibleStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Updating…" : "Update status"}
        </Button>
      </form>
    </Card>
  );
}
