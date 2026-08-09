"use client";

import { CircleCheckBig, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SegmentedControl } from "@/components/layout/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { AdminSectionCard } from "@/features/admin/ui/AdminSectionCard";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { updateContactStatusAction } from "@/features/contact/application/update-contact-status";
import {
  CONTACT_STATUSES,
  type ContactStatus,
} from "@/features/contact/domain/contact-rules";

type UpdateContactStatusFormProps = {
  locale: string;
  messageId: string;
  currentStatus: ContactStatus;
  eligibleStatuses: ContactStatus[];
};

function contactStatusLabel(
  status: ContactStatus,
  labels: {
    unread: string;
    read: string;
    replied: string;
    archived: string;
  },
): string {
  if (status === "UNREAD") return labels.unread;
  if (status === "READ") return labels.read;
  if (status === "REPLIED") return labels.replied;
  return labels.archived;
}

export function UpdateContactStatusForm({
  locale,
  messageId,
  currentStatus,
  eligibleStatuses,
}: UpdateContactStatusFormProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.messages;
  const common = dictionary.common;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ContactStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-600">{copy.forms.noFurtherChanges}</p>
    );
  }

  const statusOptions = CONTACT_STATUSES.filter(
    (item) => item === currentStatus || eligibleStatuses.includes(item),
  ).map((item) => ({
    value: item,
    label: contactStatusLabel(item, copy.status),
  }));

  return (
    <AdminSectionCard
      icon={<CircleCheckBig className="h-5 w-5" />}
      title={
        <>
          {copy.detail.status}
          {": "}
          <span className="text-brand-red">
            {contactStatusLabel(currentStatus, copy.status)}
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
