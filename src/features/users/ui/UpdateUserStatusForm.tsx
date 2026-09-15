"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { updateUserStatusAction } from "@/features/users/application/update-user";
import {
  USER_STATUSES,
  type UserStatus,
} from "@/features/users/domain/user-lifecycle";
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
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return <p className="text-sm text-gray-600">{forms.terminalStatus}</p>;
  }

  const statusOptions = USER_STATUSES.filter(
    (item) => item === currentStatus || eligibleStatuses.includes(item),
  ).map((item) => ({
    value: item,
    label: adminUserStatusLabel(item, dictionary.users.statuses),
  }));

  function onStatusChange(next: string): void {
    if (!USER_STATUSES.includes(next as UserStatus)) {
      return;
    }
    const nextStatus = next as UserStatus;
    setStatus(nextStatus);
    if (nextStatus === currentStatus) {
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await updateUserStatusAction(locale, {
        userId,
        status: nextStatus,
      });
      if (!result.ok) {
        setStatus(currentStatus);
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-[14rem]">
      <AdminSelect
        label={forms.status}
        name="userStatus"
        value={status}
        options={statusOptions}
        placeholder={forms.newStatus}
        disabled={isPending}
        onChange={onStatusChange}
        hideLabel
      />
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
