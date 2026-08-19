"use client";

import {
  CalendarDays,
  Mail,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Card } from "@/components/ui/Card";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminDetailField } from "@/features/admin/ui/AdminDetailField";
import { AdminSectionCard } from "@/features/admin/ui/AdminSectionCard";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import type { AdminContactMessageDetail } from "@/features/contact/application/get-admin-contact-message";
import {
  contactStatusBadgeClass,
  contactStatusLabel,
} from "@/features/contact/ui/contact-status-ui";
import { formatAppDateTimeSeconds } from "@/lib/datetime/app-timezone";

const FIELD_ICON_CLASS = "h-4 w-4";

type AdminMessageDetailsSheetProps = {
  open: boolean;
  onClose: () => void;
  detail: AdminContactMessageDetail | null;
  error: string | null;
  isLoading: boolean;
};

/** Inbox side sheet: sender fields and message body. */
export function AdminMessageDetailsSheet({
  open,
  onClose,
  detail,
  error,
  isLoading,
}: AdminMessageDetailsSheetProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.messages;
  const common = dictionary.common;

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={detail?.subject ?? copy.title}
      subtitle={
        detail ? formatAppDateTimeSeconds(detail.createdAt) : undefined
      }
      closeLabel={common.close}
      headerActions={
        detail && !isLoading && !error ? (
          <span
            className={`${ADMIN_BADGE} ${contactStatusBadgeClass(detail.status)}`}
          >
            {contactStatusLabel(detail.status, copy.status)}
          </span>
        ) : null
      }
      desktopWidthPercent={40}
      mobileMaxWidthClassName="max-w-2xl"
      panelClassName="!bg-brand-surface"
      headerClassName="!border-0 !bg-brand-surface"
      bodyClassName="!bg-brand-surface"
    >
      {isLoading ? (
        <p className="py-8 text-sm text-gray-600">{common.loading}</p>
      ) : null}
      {error ? <p className="py-8 text-sm text-red-700">{error}</p> : null}
      {!isLoading && !error && detail ? (
        <div className="space-y-4">
          <Card
            className={`!border-0 !shadow-none p-5 sm:p-6 ${ADMIN_CARD_CLASS}`}
          >
            <div className="grid gap-4">
              <AdminDetailField
                icon={<User className={FIELD_ICON_CLASS} />}
                label={copy.detail.from}
              >
                {detail.name}
              </AdminDetailField>
              <AdminDetailField
                icon={<Mail className={FIELD_ICON_CLASS} />}
                label={copy.detail.email}
              >
                {detail.email}
              </AdminDetailField>
              <AdminDetailField
                icon={<Phone className={FIELD_ICON_CLASS} />}
                label={copy.detail.phone}
              >
                {detail.phone ?? common.dash}
              </AdminDetailField>
              <AdminDetailField
                icon={<CalendarDays className={FIELD_ICON_CLASS} />}
                label={copy.detail.received}
              >
                {formatAppDateTimeSeconds(detail.createdAt)}
              </AdminDetailField>
            </div>
          </Card>

          <AdminSectionCard
            icon={<MessageSquare className="h-5 w-5" />}
            title={copy.detail.message}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {detail.message}
            </p>
          </AdminSectionCard>
        </div>
      ) : null}
    </SideSheet>
  );
}
