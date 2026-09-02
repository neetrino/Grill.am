"use client";

import {
  CalendarDays,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SideSheet } from "@/components/drawer/SideSheet";
import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { Card } from "@/components/ui/Card";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminDetailField } from "@/features/admin/ui/AdminDetailField";
import { AdminSectionCard } from "@/features/admin/ui/AdminSectionCard";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { deleteContactMessageAction } from "@/features/contact/application/delete-contact-message";
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
  locale: string;
  detail: AdminContactMessageDetail | null;
  error: string | null;
  isLoading: boolean;
};

/** Inbox side sheet: sender fields and message body. */
export function AdminMessageDetailsSheet({
  open,
  onClose,
  locale,
  detail,
  error,
  isLoading,
}: AdminMessageDetailsSheetProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.messages;
  const common = dictionary.common;
  const { confirmDelete } = useConfirmDelete();
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete(): void {
    if (!detail) return;

    const confirmMessage = copy.confirmDelete
      ? formatAdminMessage(copy.confirmDelete, { subject: detail.subject })
      : common.confirmDelete;

    void (async () => {
      const accepted = await confirmDelete({
        title: common.confirmDeleteTitle,
        message: confirmMessage,
        confirmText: common.delete,
        cancelText: common.cancel,
      });
      if (!accepted) return;

      startDelete(async () => {
        setDeleteError(null);
        const result = await deleteContactMessageAction(locale, {
          messageId: detail.id,
        });
        if (!result.ok) {
          setDeleteError(result.error.message);
          return;
        }
        onClose();
        router.refresh();
      });
    })();
  }

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
          <div className="flex items-center gap-2">
            <span
              className={`${ADMIN_BADGE} ${contactStatusBadgeClass(detail.status)}`}
            >
              {contactStatusLabel(detail.status, copy.status)}
            </span>
            <button
              type="button"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleDelete();
              }}
              className="rounded p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              aria-label={
                copy.deleteNamed
                  ? formatAdminMessage(copy.deleteNamed, {
                      subject: detail.subject,
                    })
                  : common.delete
              }
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
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
      {deleteError ? (
        <p className="mb-4 rounded-[15px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      ) : null}
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
