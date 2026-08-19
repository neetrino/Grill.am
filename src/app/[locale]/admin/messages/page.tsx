import { notFound } from "next/navigation";

import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import { AdminMessagesFilters } from "@/features/contact/ui/AdminMessagesFilters";
import { AdminMessagesView } from "@/features/contact/ui/AdminMessagesView";
import { contactStatusLabel } from "@/features/contact/ui/contact-status-ui";
import { listAdminContactMessages } from "@/features/contact/application/queries";
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
        <AdminPageTitle>{copy.title}</AdminPageTitle>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>
          {countLabel}
          {statusFilterLabel ? ` · ${statusFilterLabel}` : ""}
        </p>
      </div>

      <AdminMessagesFilters q={filters.q} status={filters.status} />

      <AdminMessagesView locale={locale} messages={rows} />

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
