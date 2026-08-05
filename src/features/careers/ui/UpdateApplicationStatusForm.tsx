"use client";

import { CircleCheckBig, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SegmentedControl } from "@/components/layout/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { AdminSectionCard } from "@/features/admin/ui/AdminSectionCard";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { updateJobApplicationStatusAction } from "@/features/careers/application/update-application-status";
import {
  JOB_APPLICATION_STATUSES,
  type JobApplicationStatus,
} from "@/features/careers/domain/application-rules";

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
  const [status, setStatus] = useState<JobApplicationStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-600">{copy.forms.noFurtherChanges}</p>
    );
  }

  const statusOptions = JOB_APPLICATION_STATUSES.filter(
    (item) => item === currentStatus || eligibleStatuses.includes(item),
  ).map((item) => ({
    value: item,
    label: applicationStatusLabel(item, copy.status),
  }));

  return (
    <AdminSectionCard
      icon={<CircleCheckBig className="h-5 w-5" />}
      title={
        <>
          {copy.detail.status}
          {": "}
          <span className="text-brand-red">
            {applicationStatusLabel(currentStatus, copy.status)}
          </span>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();

          startTransition(async () => {
            setError(null);
            const result = await updateJobApplicationStatusAction(locale, {
              applicationId,
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SegmentedControl
            aria-label={copy.forms.newStatus}
            value={status}
            options={statusOptions}
            size="md"
            fitContent
            disabled={isPending}
            onSelect={setStatus}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending || status === currentStatus}
            className="w-full gap-2 sm:w-auto"
          >
            <Send className="h-4 w-4" />
            {isPending ? common.updating : copy.forms.updateStatus}
          </Button>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </AdminSectionCard>
  );
}
