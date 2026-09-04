"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Card } from "@/components/ui/Card";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CENTER,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import { AdminTableDateTime } from "@/features/admin/ui/AdminTableDateTime";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import {
  getAdminContactMessageAction,
  type AdminContactMessageDetail,
} from "@/features/contact/application/get-admin-contact-message";
import { updateContactStatusAction } from "@/features/contact/application/update-contact-status";
import { AdminMessageDetailsSheet } from "@/features/contact/ui/AdminMessageDetailsSheet";
import {
  contactStatusBadgeClass,
  contactStatusLabel,
} from "@/features/contact/ui/contact-status-ui";

type AdminMessagesViewMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  spamScore: number | null;
  createdAt: Date | string;
};

type AdminMessagesViewProps = {
  locale: string;
  messages: AdminMessagesViewMessage[];
};

/**
 * Admin inbox table. Opens the same message sheet instead of a detail page.
 */
export function AdminMessagesView({
  locale,
  messages,
}: AdminMessagesViewProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.messages;
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detail, setDetail] = useState<AdminContactMessageDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openMessage(messageId: string): void {
    setSheetOpen(true);
    setDetail(null);
    setError(null);

    startTransition(async () => {
      const result = await getAdminContactMessageAction(locale, messageId);
      if (!result.ok) {
        setError(result.error.message);
        setDetail(null);
        return;
      }

      let next = result.value;
      if (next.status === "UNREAD") {
        const marked = await updateContactStatusAction(locale, {
          messageId: next.id,
          status: "READ",
        });
        if (marked.ok) {
          next = { ...next, status: "READ" };
          router.refresh();
        }
      }

      setDetail(next);
    });
  }

  return (
    <>
      <Card className={ADMIN_TABLE_CARD}>
        {messages.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {copy.empty}
          </p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>{copy.table.subject}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.from}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.status}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.table.received}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {messages.map((message) => (
                  <tr
                    key={message.id}
                    className={`${ADMIN_TABLE_ROW} cursor-pointer`}
                    tabIndex={0}
                    role="button"
                    aria-label={formatAdminMessage(copy.openNamed, {
                      subject: message.subject,
                    })}
                    onClick={() => openMessage(message.id)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      openMessage(message.id);
                    }}
                  >
                    <td className={ADMIN_TABLE_TD}>
                      <span className="font-medium text-gray-900">
                        {message.subject}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <p className="text-sm text-gray-900">{message.name}</p>
                      <p className="text-xs text-gray-500">{message.email}</p>
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <span
                        className={`${ADMIN_BADGE} ${contactStatusBadgeClass(message.status)}`}
                      >
                        {contactStatusLabel(message.status, copy.status)}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE_TD_CENTER}>
                      <AdminTableDateTime value={message.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <AdminMessageDetailsSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setDetail(null);
          setError(null);
        }}
        locale={locale}
        detail={detail}
        error={error}
        isLoading={isPending}
      />
    </>
  );
}
