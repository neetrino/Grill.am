"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { ADMIN_INPUT, ADMIN_LABEL } from "@/features/admin/ui/admin-form-classes";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_BTN_PRIMARY_CLASS,
  ADMIN_CARD_CLASS,
} from "@/features/admin/ui/admin-ui";
import {
  CONTACT_STATUSES,
  type ContactStatus,
} from "@/features/contact/domain/contact-rules";

type AdminMessagesFiltersProps = {
  q?: string;
  status?: ContactStatus;
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

export function AdminMessagesFilters({
  q,
  status,
}: AdminMessagesFiltersProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.messages;
  const common = dictionary.common;
  const router = useRouter();
  const [queryValue, setQueryValue] = useState(q ?? "");
  const [statusValue, setStatusValue] = useState(status ?? "");

  const statusOptions = [
    { value: "", label: common.all },
    ...CONTACT_STATUSES.map((item) => ({
      value: item,
      label: contactStatusLabel(item, copy.status),
    })),
  ];

  function pushFilters(next: { q: string; status: string }): void {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.status) params.set("status", next.status);
    const query = params.toString();
    router.push(query ? `?${query}` : "?");
  }

  return (
    <Card
      className={`mb-6 overflow-visible !border-0 !shadow-none p-4 ${ADMIN_CARD_CLASS}`}
    >
      <form
        method="get"
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          pushFilters({ q: queryValue, status: statusValue });
        }}
      >
        <label className="min-w-[180px] flex-1">
          <span className={ADMIN_LABEL}>{common.search}</span>
          <input
            name="q"
            value={queryValue}
            onChange={(event) => setQueryValue(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className={ADMIN_INPUT}
          />
        </label>
        <div className="min-w-[180px]">
          <AdminSelect
            label={common.status}
            placeholder={common.all}
            options={statusOptions}
            value={statusValue}
            onChange={(value) => {
              setStatusValue(value);
              pushFilters({ q: queryValue, status: value });
            }}
          />
        </div>
        <button type="submit" className={ADMIN_BTN_PRIMARY_CLASS}>
          {common.filter}
        </button>
      </form>
    </Card>
  );
}
