import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
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
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import {
  listAdminJobApplicationJobOptions,
  listAdminJobApplications,
} from "@/features/careers/application/application-queries";
import {
  isJobApplicationStatus,
  type JobApplicationStatus,
} from "@/features/careers/domain/application-rules";
import { adminJobApplicationFilterSchema } from "@/features/careers/schemas/application";
import { AdminApplicationsFilters } from "@/features/careers/ui/AdminApplicationsFilters";
import { formatAppDateTimeMinutes } from "@/lib/datetime/app-timezone";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminApplicationsPageProps = {
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

export default async function AdminApplicationsPage({
  params,
  searchParams,
}: AdminApplicationsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale).admin;
  const careers = dictionary.careers;
  const copy = careers.applications;
  const common = dictionary.common;

  const raw = await searchParams;
  const parsed = adminJobApplicationFilterSchema.safeParse({
    status: firstParam(raw.status) || undefined,
    jobPostingId: firstParam(raw.jobPostingId) || undefined,
    q: firstParam(raw.q) || undefined,
    page: firstParam(raw.page) ?? "1",
  });

  const filters = parsed.success
    ? parsed.data
    : {
        page: 1 as const,
        status: undefined,
        jobPostingId: undefined,
        q: undefined,
      };

  const [{ rows, total, pageSize }, jobOptions] = await Promise.all([
    listAdminJobApplications(locale, filters),
    listAdminJobApplicationJobOptions(locale),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const countLabel = fillTemplate(copy.count, { count: String(total) });
  const statusFilterLabel = filters.status
    ? applicationStatusLabel(filters.status, copy.status)
    : null;

  return (
    <>
      <p className={`mb-4 ${ADMIN_PAGE_SUBTITLE}`}>
        {countLabel}
        {statusFilterLabel ? ` · ${statusFilterLabel}` : ""}
      </p>

      <AdminApplicationsFilters
        q={filters.q}
        status={
          filters.status && isJobApplicationStatus(filters.status)
            ? filters.status
            : undefined
        }
        jobPostingId={filters.jobPostingId}
        jobOptions={jobOptions}
      />

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
                  <th className={ADMIN_TABLE_TH}>{copy.table.candidate}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.table.job}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.table.status}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{copy.table.cv}</th>
                  <th className={ADMIN_TABLE_TH}>{copy.table.received}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {rows.map((application) => (
                  <tr
                    key={application.id}
                    className={`${ADMIN_TABLE_ROW} group relative`}
                  >
                    <td className={ADMIN_TABLE_TD}>
                      <Link
                        href={`/${locale}/admin/careers/applications/${application.id}`}
                        className="font-medium text-gray-900 after:absolute after:inset-0 group-hover:underline"
                      >
                        {application.name}
                      </Link>
                      <p className="text-xs text-gray-500">{application.email}</p>
                      <p className="text-xs text-gray-500">{application.phone}</p>
                    </td>
                    <td className={ADMIN_TABLE_TD_CENTER}>
                      <span className="text-sm text-gray-900">
                        {application.jobTitle}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE_TD_CENTER}>
                      <span
                        className={`${ADMIN_BADGE} ${applicationStatusBadgeClass(application.status)}`}
                      >
                        {applicationStatusLabel(application.status, copy.status)}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE_TD_CENTER}>
                      <span className="text-sm text-gray-700">
                        {application.hasCv ? copy.cvYes : copy.cvNo}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE_TD}>
                      <span className="text-xs text-gray-500">
                        {formatAppDateTimeMinutes(application.createdAt)}{" "}
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
    </>
  );
}
