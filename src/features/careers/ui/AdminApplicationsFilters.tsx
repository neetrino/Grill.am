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
  JOB_APPLICATION_STATUSES,
  type JobApplicationStatus,
} from "@/features/careers/domain/application-rules";
import type { AdminJobFilterOption } from "@/features/careers/application/application-queries";

type AdminApplicationsFiltersProps = {
  q?: string;
  status?: JobApplicationStatus;
  jobPostingId?: string;
  jobOptions: AdminJobFilterOption[];
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

export function AdminApplicationsFilters({
  q,
  status,
  jobPostingId,
  jobOptions,
}: AdminApplicationsFiltersProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.careers.applications;
  const common = dictionary.common;
  const router = useRouter();
  const [queryValue, setQueryValue] = useState(q ?? "");
  const [statusValue, setStatusValue] = useState(status ?? "");
  const [jobValue, setJobValue] = useState(jobPostingId ?? "");

  const statusOptions = [
    { value: "", label: common.all },
    ...JOB_APPLICATION_STATUSES.map((item) => ({
      value: item,
      label: applicationStatusLabel(item, copy.status),
    })),
  ];

  const jobSelectOptions = [
    { value: "", label: common.all },
    ...jobOptions.map((job) => ({
      value: job.id,
      label: job.title,
    })),
  ];

  function pushFilters(next: {
    q: string;
    status: string;
    jobPostingId: string;
  }): void {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.status) params.set("status", next.status);
    if (next.jobPostingId) params.set("jobPostingId", next.jobPostingId);
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
          pushFilters({
            q: queryValue,
            status: statusValue,
            jobPostingId: jobValue,
          });
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
              pushFilters({
                q: queryValue,
                status: value,
                jobPostingId: jobValue,
              });
            }}
          />
        </div>
        <div className="min-w-[200px]">
          <AdminSelect
            label={copy.filters.job}
            placeholder={common.all}
            options={jobSelectOptions}
            value={jobValue}
            onChange={(value) => {
              setJobValue(value);
              pushFilters({
                q: queryValue,
                status: statusValue,
                jobPostingId: value,
              });
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
