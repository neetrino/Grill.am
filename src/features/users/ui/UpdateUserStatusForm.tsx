"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_SECTION_TITLE } from "@/features/admin/ui/admin-form-classes";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { CheckoutSelect } from "@/features/checkout/ui/CheckoutSelect";
import { updateUserStatusAction } from "@/features/users/application/update-user";
import type { UserStatus } from "@/features/users/domain/user-lifecycle";
import { adminUserStatusLabel } from "@/features/users/ui/admin-user-labels";

type UpdateUserStatusFormProps = {
  locale: string;
  userId: string;
  currentStatus: UserStatus;
  eligibleStatuses: UserStatus[];
};

export function UpdateUserStatusForm({
  locale,
  userId,
  currentStatus,
  eligibleStatuses,
}: UpdateUserStatusFormProps) {
  const dictionary = useAdminDictionary();
  const forms = dictionary.users.forms;
  const common = dictionary.common;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(eligibleStatuses[0] ?? "");
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-600">{forms.terminalStatus}</p>
    );
  }

  const statusOptions = eligibleStatuses.map((item) => ({
    value: item,
    label: adminUserStatusLabel(item, dictionary.users.statuses),
  }));

  return (
    <Card className={`overflow-visible !border-0 !shadow-none p-6 ${ADMIN_CARD_CLASS}`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextStatus = String(formData.get("status") ?? "") as UserStatus;

          startTransition(async () => {
            setError(null);
            const result = await updateUserStatusAction(locale, {
              userId,
              status: nextStatus,
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        <h3 className={ADMIN_SECTION_TITLE}>{forms.status}</h3>
        <p className="text-sm text-gray-700">
          {forms.current}:{" "}
          <strong className="text-gray-900">
            {adminUserStatusLabel(currentStatus, dictionary.users.statuses)}
          </strong>
        </p>
        <CheckoutSelect
          name="status"
          label={forms.newStatus}
          placeholder={forms.newStatus}
          required
          options={statusOptions}
          value={status}
          disabled={isPending}
          onChange={setStatus}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? common.updating : forms.updateStatus}
        </Button>
      </form>
    </Card>
  );
}
