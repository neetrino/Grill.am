"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { updateJobApplicationStatusAction } from "@/features/careers/application/update-application-status";
import type { JobApplicationStatus } from "@/features/careers/domain/application-rules";

type UpdateApplicationStatusFormProps = {
  locale: string;
  applicationId: string;
  currentStatus: JobApplicationStatus;
  eligibleStatuses: JobApplicationStatus[];
};

function applicationStatusLabel(
  status: JobApplicationStatus,
  labels: {
    unread: string;
    read: string;
    archived: string;
  },
): string {
  if (status === "UNREAD") return labels.unread;
  if (status === "READ") return labels.read;
  return labels.archived;
}

export function UpdateApplicationStatusForm({
  locale,
  applicationId,
  currentStatus,
  eligibleStatuses,
}: UpdateApplicationStatusFormProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.careers.applications;
  const common = dictionary.common;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(eligibleStatuses[0] ?? "");
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-600">{copy.forms.noFurtherChanges}</p>
    );
  }

  const statusOptions = eligibleStatuses.map((item) => ({
    value: item,
    label: applicationStatusLabel(item, copy.status),
  }));

  return (
    <Card
      className={`overflow-visible !border-0 !shadow-none p-6 ${ADMIN_CARD_CLASS}`}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextStatus = String(
            formData.get("status") ?? "",
          ) as JobApplicationStatus;

          startTransition(async () => {
            setError(null);
            const result = await updateJobApplicationStatusAction(locale, {
              applicationId,
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
        <p className="text-sm text-gray-700">
          {copy.forms.current}:{" "}
          <strong className="text-gray-900">
            {applicationStatusLabel(currentStatus, copy.status)}
          </strong>
        </p>
        <AdminSelect
          name="status"
          label={copy.forms.newStatus}
          placeholder={copy.forms.newStatus}
          required
          options={statusOptions}
          value={status}
          disabled={isPending}
          onChange={setStatus}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? common.updating : copy.forms.updateStatus}
        </Button>
      </form>
    </Card>
  );
}
