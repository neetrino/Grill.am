import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import { listAdminUsers } from "@/features/users/application/queries";
import { adminUsersFilterSchema } from "@/features/users/schemas/admin-users";
import { AdminUsersView } from "@/features/users/ui/AdminUsersView";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminUsersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type UsersQueryFilters = {
  q?: string;
  role?: string;
  status?: string;
  sort: string;
  dir: string;
  page: number;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildUsersQuery(
  filters: UsersQueryFilters,
  overrides: Partial<UsersQueryFilters> = {},
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.role) params.set("role", merged.role);
  if (merged.status) params.set("status", merged.status);
  if (merged.sort !== "created") params.set("sort", merged.sort);
  if (merged.dir !== "desc") params.set("dir", merged.dir);
  if (merged.page > 1) params.set("page", String(merged.page));
  return params.toString();
}

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    return values[key] ?? "";
  });
}

export default async function AdminUsersPage({
  params,
  searchParams,
}: AdminUsersPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const admin = getDictionary(locale).admin;
  const common = admin.common;

  const raw = await searchParams;
  const parsed = adminUsersFilterSchema.safeParse({
    q: firstParam(raw.q) || undefined,
    role: firstParam(raw.role) || undefined,
    status: firstParam(raw.status) || undefined,
    sort: firstParam(raw.sort) ?? "created",
    dir: firstParam(raw.dir) ?? "desc",
    page: firstParam(raw.page) ?? "1",
  });

  const filters = parsed.success
    ? parsed.data
    : {
        page: 1 as const,
        sort: "created" as const,
        dir: "desc" as const,
        q: undefined,
        role: undefined,
        status: undefined,
      };

  const { rows, total, pageSize } = await listAdminUsers(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function usersHref(overrides: Partial<UsersQueryFilters> = {}): string {
    const query = buildUsersQuery(filters, overrides);
    return query
      ? `/${locale}/admin/users?${query}`
      : `/${locale}/admin/users`;
  }

  return (
    <>
      <div className="mb-6">
        <AdminPageTitle>{admin.users.title}</AdminPageTitle>
      </div>

      <AdminUsersView
        locale={locale}
        users={rows}
        total={total}
        q={filters.q}
        role={filters.role}
        sort={filters.sort}
        dir={filters.dir}
        sortOrdersAscHref={usersHref({
          sort: "orders",
          dir: "asc",
          page: 1,
        })}
        sortOrdersDescHref={usersHref({
          sort: "orders",
          dir: "desc",
          page: 1,
        })}
      />

      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center gap-3 text-sm text-gray-700">
          {filters.page > 1 ? (
            <Link
              href={usersHref({ page: filters.page - 1 })}
              className="font-medium hover:underline"
            >
              {common.previous}
            </Link>
          ) : null}
          <span>
            {fillTemplate(common.pageOf, {
              page: String(filters.page),
              totalPages: String(totalPages),
            })}
          </span>
          {filters.page < totalPages ? (
            <Link
              href={usersHref({ page: filters.page + 1 })}
              className="font-medium hover:underline"
            >
              {common.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
