"use client";

import { CircleCheckBig, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SegmentedControl } from "@/components/layout/SegmentedControl";
import { ADMIN_BTN_PRIMARY_CLASS } from "@/features/admin/ui/admin-ui";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { updateContactStatusAction } from "@/features/contact/application/update-contact-status";
import {
  CONTACT_STATUSES,
  type ContactStatus,
} from "@/features/contact/domain/contact-rules";
import { contactStatusLabel } from "@/features/contact/ui/contact-status-ui";
import { AdminUserActionCard } from "@/features/users/ui/AdminUserActionCard";

type UpdateContactStatusFormProps = {
  locale: string;
  messageId: string;
  currentStatus: ContactStatus;
  eligibleStatuses: ContactStatus[];
  onUpdated?: (status: ContactStatus) => void;
};

export function UpdateContactStatusForm({
  locale,
  messageId,
  currentStatus,
  eligibleStatuses,
  onUpdated,
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
    <AdminUserActionCard
      icon={<CircleCheckBig className="h-5 w-5" aria-hidden />}
      title={copy.detail.status}
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
            onUpdated?.(status);
            router.refresh();
          });
        }}
      >
        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto">
          <SegmentedControl
            aria-label={copy.forms.newStatus}
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
