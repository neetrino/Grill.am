import {
  BriefcaseBusiness,
  CalendarDays,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { ADMIN_SECTION_TITLE } from "@/features/admin/ui/admin-form-classes";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { AdminDetailField } from "@/features/admin/ui/AdminDetailField";
import { AdminSectionCard } from "@/features/admin/ui/AdminSectionCard";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { getAdminJobApplicationById } from "@/features/careers/application/application-queries";
import {
  getEligibleJobApplicationStatuses,
  isJobApplicationStatus,
  type JobApplicationStatus,
} from "@/features/careers/domain/application-rules";
import { UpdateApplicationStatusForm } from "@/features/careers/ui/UpdateApplicationStatusForm";
import { formatAppDateTimeSeconds } from "@/lib/datetime/app-timezone";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminApplicationDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

const FIELD_ICON_CLASS = "h-4 w-4";

const SECTION_ICON_CLASS = "h-5 w-5";

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
    <>
      <h2 className={`mb-4 ${ADMIN_SECTION_TITLE}`}>{application.name}</h2>

      <Card
        className={`mb-4 !border-0 !shadow-none p-5 sm:p-6 ${ADMIN_CARD_CLASS}`}
      >
        <div className="grid gap-4 md:grid-cols-2 md:gap-x-10">
          <AdminDetailField
            icon={<User className={FIELD_ICON_CLASS} />}
            label={copy.detail.candidate}
          >
            {application.name}
          </AdminDetailField>
          <AdminDetailField
            icon={<Mail className={FIELD_ICON_CLASS} />}
            label={copy.detail.email}
          >
            {application.email}
          </AdminDetailField>
          <AdminDetailField
            icon={<Phone className={FIELD_ICON_CLASS} />}
            label={copy.detail.phone}
          >
            {application.phone}
          </AdminDetailField>
          <AdminDetailField
            icon={<BriefcaseBusiness className={FIELD_ICON_CLASS} />}
            label={copy.detail.job}
          >
            {application.jobTitle}
          </AdminDetailField>
          <AdminDetailField
            icon={<BriefcaseBusiness className={FIELD_ICON_CLASS} />}
            label={copy.detail.status}
          >
            <span
              className={`${ADMIN_BADGE} ${applicationStatusBadgeClass(application.status)}`}
            >
              {applicationStatusLabel(application.status, copy.status)}
            </span>
          </AdminDetailField>
          <AdminDetailField
            icon={<CalendarDays className={FIELD_ICON_CLASS} />}
            label={copy.detail.received}
          >
            {formatAppDateTimeSeconds(application.createdAt)}{" "}
            {common.utc}
          </AdminDetailField>
        </div>
      </Card>

      <AdminSectionCard
        className="mb-4"
        icon={<MessageSquare className={SECTION_ICON_CLASS} />}
        title={copy.detail.message}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {application.message}
        </p>
      </AdminSectionCard>

      <AdminSectionCard
        className="mb-4"
        icon={<FileText className={SECTION_ICON_CLASS} />}
        title={copy.detail.cv}
        action={
          <a
            href={`/api/admin/job-applications/${application.id}/cv`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[15px] bg-brand-red px-5 text-sm font-semibold text-white transition hover:bg-brand-red-hot"
          >
            <Download className="h-4 w-4" />
            {copy.detail.downloadCv}
          </a>
        }
      >
        <p className="text-sm text-gray-500">
          {application.cvFileName} · {formatFileSize(application.cvByteSize)} ·{" "}
          {application.cvMimeType}
        </p>
      </AdminSectionCard>

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
    </>
  );
}
