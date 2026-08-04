import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { getAdminJobApplicationById } from "@/features/careers/application/application-queries";
import {
  getEligibleJobApplicationStatuses,
  isJobApplicationStatus,
  type JobApplicationStatus,
} from "@/features/careers/domain/application-rules";
import { AdminCareersTabs } from "@/features/careers/ui/AdminCareersTabs";
import { UpdateApplicationStatusForm } from "@/features/careers/ui/UpdateApplicationStatusForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminApplicationDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function applicationStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "UNREAD") return "bg-brand-yellow/25 text-brand-ink";
  if (normalized === "READ") return "bg-brand-cream text-brand-ink";
  if (normalized === "ARCHIVED") return "bg-gray-100 text-gray-800";
  return "bg-gray-100 text-gray-800";
}

function applicationStatusLabel(
  status: string,
  labels: {
    unread: string;
    read: string;
    archived: string;
  },
): string {
  const normalized = status.toUpperCase() as JobApplicationStatus;
  if (normalized === "UNREAD") return labels.unread;
  if (normalized === "READ") return labels.read;
  if (normalized === "ARCHIVED") return labels.archived;
  return status;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminApplicationDetailPage({
  params,
}: AdminApplicationDetailPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale).admin;
  const careers = dictionary.careers;
  const copy = careers.applications;
  const common = dictionary.common;

  const application = await getAdminJobApplicationById(locale, id);
  if (!application) {
    notFound();
  }

  const status = isJobApplicationStatus(application.status)
    ? application.status
    : null;
  const eligible = status ? getEligibleJobApplicationStatuses(status) : [];

  return (
    <section>
      <div className="mb-6">
        <p className={`mb-1 ${ADMIN_PAGE_SUBTITLE}`}>
          <Link
            href={`/${locale}/admin/careers/applications`}
            className="font-medium text-gray-700 hover:underline"
          >
            {copy.title}
          </Link>
        </p>
        <AdminPageTitle>{application.name}</AdminPageTitle>
      </div>

      <AdminCareersTabs
        locale={locale}
        active="applications"
        postingsLabel={careers.tabs.postings}
        applicationsLabel={careers.tabs.applications}
      />

      <Card className="mb-6 p-6">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <p className="text-gray-700">
            {copy.detail.candidate}:{" "}
            <strong className="text-gray-900">{application.name}</strong>
          </p>
          <p className="text-gray-700">
            {copy.detail.email}: {application.email}
          </p>
          <p className="text-gray-700">
            {copy.detail.phone}: {application.phone}
          </p>
          <p className="text-gray-700">
            {copy.detail.job}: {application.jobTitle}
          </p>
          <p className="text-gray-700">
            {copy.detail.status}:{" "}
            <span
              className={`${ADMIN_BADGE} ${applicationStatusBadgeClass(application.status)}`}
            >
              {applicationStatusLabel(application.status, copy.status)}
            </span>
          </p>
          <p className="text-gray-700">
            {copy.detail.received}:{" "}
            {application.createdAt.toISOString().slice(0, 19).replace("T", " ")}{" "}
            {common.utc}
          </p>
        </div>
      </Card>

      <Card className="mb-6 p-6">
        <h2 className={`mb-3 ${ADMIN_SECTION_TITLE}`}>{copy.detail.message}</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {application.message}
        </p>
      </Card>

      <Card className="mb-6 p-6">
        <h2 className={`mb-3 ${ADMIN_SECTION_TITLE}`}>{copy.detail.cv}</h2>
        <p className="mb-3 text-sm text-gray-700">
          {application.cvFileName} · {formatFileSize(application.cvByteSize)} ·{" "}
          {application.cvMimeType}
        </p>
        <a
          href={`/api/admin/job-applications/${application.id}/cv`}
          className="inline-flex h-10 items-center justify-center rounded-[12px] bg-brand-red px-4 text-sm font-semibold text-white transition hover:bg-brand-red-hot"
        >
          {copy.detail.downloadCv}
        </a>
      </Card>

      {status ? (
        <UpdateApplicationStatusForm
          locale={locale}
          applicationId={application.id}
          currentStatus={status}
          eligibleStatuses={eligible}
        />
      ) : (
        <p className="text-sm text-red-700">{common.unknownStatus}</p>
      )}
    </section>
  );
}
