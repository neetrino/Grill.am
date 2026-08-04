import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { getAdminContactMessageById } from "@/features/contact/application/queries";
import {
  getEligibleContactStatuses,
  isContactStatus,
  type ContactStatus,
} from "@/features/contact/domain/contact-rules";
import { UpdateContactStatusForm } from "@/features/contact/ui/UpdateContactStatusForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminMessageDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function contactStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "UNREAD") return "bg-brand-yellow/25 text-brand-ink";
  if (normalized === "READ") return "bg-brand-cream text-brand-ink";
  if (normalized === "REPLIED") return "bg-green-100 text-green-800";
  if (normalized === "ARCHIVED") return "bg-gray-100 text-gray-800";
  return "bg-gray-100 text-gray-800";
}

function contactStatusLabel(
  status: string,
  labels: {
    unread: string;
    read: string;
    replied: string;
    archived: string;
  },
): string {
  const normalized = status.toUpperCase() as ContactStatus;
  if (normalized === "UNREAD") return labels.unread;
  if (normalized === "READ") return labels.read;
  if (normalized === "REPLIED") return labels.replied;
  if (normalized === "ARCHIVED") return labels.archived;
  return status;
}

export default async function AdminMessageDetailPage({
  params,
}: AdminMessageDetailPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale).admin;
  const copy = dictionary.messages;
  const common = dictionary.common;

  const message = await getAdminContactMessageById(id);
  if (!message) {
    notFound();
  }

  const status = isContactStatus(message.status) ? message.status : null;
  const eligible = status ? getEligibleContactStatuses(status) : [];

  return (
    <section>
      <div className="mb-6">
        <p className={`mb-1 ${ADMIN_PAGE_SUBTITLE}`}>
          <Link
            href={`/${locale}/admin/messages`}
            className="font-medium text-gray-700 hover:underline"
          >
            {copy.title}
          </Link>
        </p>
        <AdminPageTitle>{message.subject}</AdminPageTitle>
      </div>

      <Card className="mb-6 p-6">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <p className="text-gray-700">
            {copy.detail.from}:{" "}
            <strong className="text-gray-900">{message.name}</strong>
          </p>
          <p className="text-gray-700">
            {copy.detail.email}: {message.email}
          </p>
          <p className="text-gray-700">
            {copy.detail.phone}: {message.phone ?? common.dash}
          </p>
          <p className="text-gray-700">
            {copy.detail.status}:{" "}
            <span
              className={`${ADMIN_BADGE} ${contactStatusBadgeClass(message.status)}`}
            >
              {contactStatusLabel(message.status, copy.status)}
            </span>
          </p>
          <p className="text-gray-700">
            {copy.detail.spamScore}:{" "}
            {message.spamScore === null ? common.dash : message.spamScore}
          </p>
          <p className="text-gray-700">
            {copy.detail.received}:{" "}
            {message.createdAt.toISOString().slice(0, 19).replace("T", " ")}{" "}
            {common.utc}
          </p>
        </div>
      </Card>

      <Card className="mb-6 p-6">
        <h2 className={`mb-3 ${ADMIN_SECTION_TITLE}`}>{copy.detail.message}</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {message.message}
        </p>
      </Card>

      {status ? (
        <UpdateContactStatusForm
          locale={locale}
          messageId={message.id}
          currentStatus={status}
          eligibleStatuses={eligible}
        />
      ) : (
        <p className="text-sm text-red-700">{common.unknownStatus}</p>
      )}
    </section>
  );
}
