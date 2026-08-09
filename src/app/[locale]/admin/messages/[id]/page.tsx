import {
  CalendarDays,
  CircleCheckBig,
  Mail,
  MessageSquare,
  Phone,
  ShieldAlert,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { AdminDetailField } from "@/features/admin/ui/AdminDetailField";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import { AdminSectionCard } from "@/features/admin/ui/AdminSectionCard";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { getAdminContactMessageById } from "@/features/contact/application/queries";
import {
  getEligibleContactStatuses,
  isContactStatus,
  type ContactStatus,
} from "@/features/contact/domain/contact-rules";
import { UpdateContactStatusForm } from "@/features/contact/ui/UpdateContactStatusForm";
import { formatAppDateTimeSeconds } from "@/lib/datetime/app-timezone";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminMessageDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

const FIELD_ICON_CLASS = "h-4 w-4";
const SECTION_ICON_CLASS = "h-5 w-5";

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

      <Card
        className={`mb-4 !border-0 !shadow-none p-5 sm:p-6 ${ADMIN_CARD_CLASS}`}
      >
        <div className="grid gap-4 md:grid-cols-2 md:gap-x-10">
          <AdminDetailField
            icon={<User className={FIELD_ICON_CLASS} />}
            label={copy.detail.from}
          >
            {message.name}
          </AdminDetailField>
          <AdminDetailField
            icon={<Mail className={FIELD_ICON_CLASS} />}
            label={copy.detail.email}
          >
            {message.email}
          </AdminDetailField>
          <AdminDetailField
            icon={<Phone className={FIELD_ICON_CLASS} />}
            label={copy.detail.phone}
          >
            {message.phone ?? common.dash}
          </AdminDetailField>
          <AdminDetailField
            icon={<CircleCheckBig className={FIELD_ICON_CLASS} />}
            label={copy.detail.status}
          >
            <span
              className={`${ADMIN_BADGE} ${contactStatusBadgeClass(message.status)}`}
            >
              {contactStatusLabel(message.status, copy.status)}
            </span>
          </AdminDetailField>
          <AdminDetailField
            icon={<ShieldAlert className={FIELD_ICON_CLASS} />}
            label={copy.detail.spamScore}
          >
            {message.spamScore === null ? common.dash : message.spamScore}
          </AdminDetailField>
          <AdminDetailField
            icon={<CalendarDays className={FIELD_ICON_CLASS} />}
            label={copy.detail.received}
          >
            {formatAppDateTimeSeconds(message.createdAt)}
          </AdminDetailField>
        </div>
      </Card>

      <AdminSectionCard
        className="mb-4"
        icon={<MessageSquare className={SECTION_ICON_CLASS} />}
        title={copy.detail.message}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {message.message}
        </p>
      </AdminSectionCard>

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
