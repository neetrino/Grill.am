"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { updateContactStatusAction } from "@/features/contact/application/update-contact-status";
import type { ContactStatus } from "@/features/contact/domain/contact-rules";

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
  const [status, setStatus] = useState(eligibleStatuses[0] ?? "");
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-600">{copy.forms.noFurtherChanges}</p>
    );
  }

  const statusOptions = eligibleStatuses.map((item) => ({
    value: item,
    label: contactStatusLabel(item, copy.status),
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
          const nextStatus = String(formData.get("status") ?? "") as ContactStatus;

          startTransition(async () => {
            setError(null);
            const result = await updateContactStatusAction(locale, {
              messageId,
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
            {contactStatusLabel(currentStatus, copy.status)}
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
