"use client";

import { CircleCheckBig, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SegmentedControl } from "@/components/layout/SegmentedControl";
import { ADMIN_BTN_PRIMARY_CLASS } from "@/features/admin/ui/admin-ui";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { updateUserStatusAction } from "@/features/users/application/update-user";
import {
  USER_STATUSES,
  type UserStatus,
} from "@/features/users/domain/user-lifecycle";
import { AdminUserActionCard } from "@/features/users/ui/AdminUserActionCard";
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
  const [status, setStatus] = useState<UserStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-600">{forms.terminalStatus}</p>
    );
  }

  const statusOptions = USER_STATUSES.filter(
    (item) => item === currentStatus || eligibleStatuses.includes(item),
  ).map((item) => ({
    value: item,
    label: adminUserStatusLabel(item, dictionary.users.statuses),
  }));

  return (
    <AdminUserActionCard
      className="min-w-0 flex-1"
      icon={<CircleCheckBig className="h-5 w-5" aria-hidden />}
      title={forms.status}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            setError(null);
            const result = await updateUserStatusAction(locale, {
              userId,
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
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            aria-label={forms.newStatus}
            value={status}
            options={statusOptions}
            size="md"
            fitContent
            disabled={isPending}
            onSelect={setStatus}
          />
          <button
            type="submit"
            disabled={isPending || status === currentStatus}
            className={`${ADMIN_BTN_PRIMARY_CLASS} shrink-0 gap-2`}
          >
            <Send className="h-4 w-4" aria-hidden />
            {isPending ? common.updating : common.update}
          </button>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </AdminUserActionCard>
  );
}
