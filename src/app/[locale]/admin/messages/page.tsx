import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_SELECT,
} from "@/features/admin/ui/admin-form-classes";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { listAdminContactMessages } from "@/features/contact/application/queries";
import {
  CONTACT_STATUSES,
  type ContactStatus,
} from "@/features/contact/domain/contact-rules";
import { adminContactFilterSchema } from "@/features/contact/schemas/contact";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminMessagesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    return values[key] ?? "";
  });
}

function contactStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "UNREAD") return "bg-blue-100 text-blue-800";
  if (normalized === "READ") return "bg-yellow-100 text-yellow-800";
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

export default async function AdminMessagesPage({
  params,
  searchParams,
}: AdminMessagesPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale).admin;
  const copy = dictionary.messages;
  const common = dictionary.common;

  const raw = await searchParams;
  const parsed = adminContactFilterSchema.safeParse({
    status: firstParam(raw.status) || undefined,
    q: firstParam(raw.q) || undefined,
    page: firstParam(raw.page) ?? "1",
  });

  const filters = parsed.success
    ? parsed.data
    : { page: 1 as const, status: undefined, q: undefined };

  const { rows, total, pageSize } = await listAdminContactMessages(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const countLabel = fillTemplate(copy.count, { count: String(total) });
  const statusFilterLabel = filters.status
    ? contactStatusLabel(filters.status, copy.status)
    : null;

  return (
    <section>
      <div className="mb-6">
        <h1 className={ADMIN_PAGE_TITLE}>{copy.title}</h1>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>
          {countLabel}
          {statusFilterLabel ? ` · ${statusFilterLabel}` : ""}
        </p>
      </div>

      <Card className="mb-6 p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="min-w-[180px] flex-1">
            <span className={ADMIN_LABEL}>{common.search}</span>
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder={copy.searchPlaceholder}
              className={ADMIN_INPUT}
            />
          </label>
          <label className="min-w-[140px]">
            <span className={ADMIN_LABEL}>{common.status}</span>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className={ADMIN_SELECT}
            >
              <option value="">{common.all}</option>
              {CONTACT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {contactStatusLabel(status, copy.status)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" size="sm">
            {common.filter}
          </Button>
        </form>
      </Card>

      <Card className={ADMIN_TABLE_CARD}>
        {rows.length === 0 ? (
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
                  <th className={ADMIN_TABLE_TH}>{copy.table.received}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {rows.map((message) => (
                  <tr key={message.id} className={ADMIN_TABLE_ROW}>
                    <td className={ADMIN_TABLE_TD}>
                      <Link
                        href={`/${locale}/admin/messages/${message.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {message.subject}
                      </Link>
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
                      {message.spamScore !== null ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {fillTemplate(copy.spamScore, {
                            score: String(message.spamScore),
                          })}
                        </p>
                      ) : null}
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <span className="text-xs text-gray-500">
                        {message.createdAt
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")}{" "}
                        {common.utc}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center gap-3 text-sm text-gray-700">
          <span>
            {fillTemplate(common.pageOf, {
              page: String(filters.page),
              totalPages: String(totalPages),
            })}
          </span>
        </nav>
      ) : null}
    </section>
  );
}
