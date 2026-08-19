"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_BTN_PRIMARY_CLASS } from "@/features/admin/ui/admin-ui";
import { AdminSearchInput } from "@/features/admin/ui/AdminSearchInput";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_CHECKBOX,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CENTER,
  ADMIN_TABLE_TD_CHECK,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_TH_CHECK,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import {
  bulkAnonymizeUsersAction,
  updateUserStatusAction,
} from "@/features/users/application/update-user";
import type { AdminUserListItem } from "@/features/users/application/queries";
import { adminUserRoleLabel } from "@/features/users/ui/admin-user-labels";

type AdminUsersViewProps = {
  locale: string;
  users: AdminUserListItem[];
  total: number;
  q?: string;
  role?: string;
  sort: string;
  dir: string;
  sortOrdersAscHref: string;
  sortOrdersDescHref: string;
};

function roleFilterHref(
  locale: string,
  role: string | undefined,
  q?: string,
  sort?: string,
  dir?: string,
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role) params.set("role", role);
  if (sort && sort !== "orders") params.set("sort", sort);
  if (dir && dir !== "desc") params.set("dir", dir);
  const query = params.toString();
  return query
    ? `/${locale}/admin/users?${query}`
    : `/${locale}/admin/users`;
}

function formatCreated(value: Date | string): string {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function displayName(user: AdminUserListItem): string {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

export function AdminUsersView({
  locale,
  users,
  total,
  q,
  role,
  sort,
  dir,
  sortOrdersAscHref,
  sortOrdersDescHref,
}: AdminUsersViewProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.users;
  const table = copy.table;
  const bulk = copy.bulk;
  const common = dictionary.common;
  const { confirmDelete } = useConfirmDelete();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ordersSortActive = sort === "orders";
  const ordersAscActive = ordersSortActive && dir === "asc";
  const ordersDescActive = ordersSortActive && dir === "desc";

  const allIds = users.map((user) => user.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleOne(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(): void {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function runAction(action: () => Promise<void>): void {
    startTransition(async () => {
      setError(null);
      try {
        await action();
        router.refresh();
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : common.actionsFailed,
        );
      }
    });
  }

  const rolePills = [
    { label: copy.rolesFilter.all, value: undefined },
    { label: copy.rolesFilter.admins, value: "ADMIN" },
    { label: copy.rolesFilter.operators, value: "OPERATOR" },
    { label: copy.rolesFilter.customers, value: "CUSTOMER" },
  ] as const;

  return (
    <section>
      <form method="get" className="mb-4 flex flex-wrap gap-3">
        <AdminSearchInput
          name="q"
          defaultValue={q ?? ""}
          placeholder={copy.searchPlaceholder}
          className="min-w-[220px] flex-1"
          aria-label={copy.searchAria}
        />
        {role ? <input type="hidden" name="role" value={role} /> : null}
        {sort !== "orders" ? (
          <input type="hidden" name="sort" value={sort} />
        ) : null}
        {dir !== "desc" ? (
          <input type="hidden" name="dir" value={dir} />
        ) : null}
        <Button type="submit" size="sm">
          {common.search}
        </Button>
      </form>

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {copy.subtitle}
        </p>
        <div className="flex flex-wrap gap-2">
          {rolePills.map((pill) => {
            const active = (role ?? undefined) === pill.value;
            return (
              <Link
                key={pill.label}
                href={roleFilterHref(locale, pill.value, q, sort, dir)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-200 text-gray-900"
                    : "bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50"
                }`}
              >
                {pill.label}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="mb-3 text-sm text-gray-600">
        {formatAdminMessage(copy.totalUsers, { total: String(total) })}
      </p>

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-gray-700">
          {formatAdminMessage(bulk.selectedCount, {
            count: String(selected.size),
          })}
        </p>
        <button
          type="button"
          disabled={isPending || selected.size === 0}
          onClick={() =>
            void (async () => {
              const accepted = await confirmDelete({
                title: common.confirmDeleteTitle,
                message: formatAdminMessage(bulk.confirmDelete, {
                  count: String(selected.size),
                }),
                confirmText: common.delete,
                cancelText: common.cancel,
              });
              if (!accepted) return;

              runAction(async () => {
                const result = await bulkAnonymizeUsersAction(locale, {
                  userIds: [...selected],
                });
                if (!result.ok) throw new Error(result.error.message);
                setSelected(new Set());
              });
            })()
          }
          className={ADMIN_BTN_PRIMARY_CLASS}
        >
          {bulk.deleteSelected}
        </button>
      </Card>

      <Card className={ADMIN_TABLE_CARD}>
        {users.length === 0 ? (
          <p className={`${ADMIN_TABLE_STATE_INSET} text-sm text-gray-600`}>
            {table.empty}
          </p>
        ) : (
          <div className={ADMIN_TABLE_OUTER_SCROLL}>
            <table className={ADMIN_TABLE}>
              <thead className={ADMIN_TABLE_THEAD}>
                <tr>
                  <th className={ADMIN_TABLE_TH_CHECK}>
                    <input
                      type="checkbox"
                      className={ADMIN_TABLE_CHECKBOX}
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={isPending || users.length === 0}
                      aria-label={table.selectAll}
                    />
                  </th>
                  <th className={ADMIN_TABLE_TH}>{table.user}</th>
                  <th className={ADMIN_TABLE_TH}>{table.contact}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>
                    <span className="inline-flex items-center justify-center gap-1">
                      <span>{table.orders}</span>
                      <span
                        className="inline-flex flex-col leading-none"
                        aria-label={table.orders}
                      >
                        <Link
                          href={sortOrdersAscHref}
                          className={`px-0.5 text-[9px] transition-colors hover:text-gray-900 ${
                            ordersAscActive
                              ? "text-gray-900"
                              : "text-gray-300"
                          }`}
                          aria-label={table.sortOrdersAsc}
                          aria-current={ordersAscActive ? "true" : undefined}
                        >
                          ▲
                        </Link>
                        <Link
                          href={sortOrdersDescHref}
                          className={`-mt-0.5 px-0.5 text-[9px] transition-colors hover:text-gray-900 ${
                            ordersDescActive
                              ? "text-gray-900"
                              : "text-gray-300"
                          }`}
                          aria-label={table.sortOrdersDesc}
                          aria-current={ordersDescActive ? "true" : undefined}
                        >
                          ▼
                        </Link>
                      </span>
                    </span>
                  </th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{table.roles}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{table.status}</th>
                  <th className={ADMIN_TABLE_TH_CENTER}>{table.created}</th>
                </tr>
              </thead>
              <tbody className={ADMIN_TABLE_TBODY}>
                {users.map((user) => {
                  const isActive = user.status === "ACTIVE";
                  const canToggle =
                    user.status === "ACTIVE" || user.status === "SUSPENDED";
                  const name = displayName(user);

                  return (
                    <tr
                      key={user.id}
                      className={`${ADMIN_TABLE_ROW} group relative`}
                    >
                      <td className={`${ADMIN_TABLE_TD_CHECK} relative z-10`}>
                        <input
                          type="checkbox"
                          className={ADMIN_TABLE_CHECKBOX}
                          checked={selected.has(user.id)}
                          onChange={() => toggleOne(user.id)}
                          disabled={isPending || user.status === "ANONYMIZED"}
                          aria-label={formatAdminMessage(table.selectUser, {
                            name,
                          })}
                        />
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <Link
                          href={`/${locale}/admin/users/${user.id}`}
                          className="block min-w-[160px] after:absolute after:inset-0"
                        >
                          <p className="font-medium text-gray-900 group-hover:underline">
                            {name}
                          </p>
                        </Link>
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          {user.phone ?? common.dash}
                        </p>
                      </td>
                      <td className={ADMIN_TABLE_TD_CENTER}>
                        <span className="font-medium text-gray-900">
                          {user.orderCount}
                        </span>
                      </td>
                      <td className={ADMIN_TABLE_TD_CENTER}>
                        <span
                          className={`${ADMIN_BADGE} uppercase ${
                            user.role === "ADMIN"
                              ? "bg-blue-100 text-blue-800"
                              : user.role === "OPERATOR"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {adminUserRoleLabel(user.role, copy.roles)}
                        </span>
                      </td>
                      <td className={ADMIN_TABLE_TD_CENTER}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          disabled={isPending || !canToggle}
                          onClick={() =>
                            runAction(async () => {
                              const result = await updateUserStatusAction(
                                locale,
                                {
                                  userId: user.id,
                                  status: isActive ? "SUSPENDED" : "ACTIVE",
                                },
                              );
                              if (!result.ok) {
                                throw new Error(result.error.message);
                              }
                            })
                          }
                          className={`relative z-10 mx-auto h-5 w-9 rounded-full transition-colors disabled:opacity-40 ${
                            isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                          aria-label={
                            isActive
                              ? formatAdminMessage(table.suspendNamed, { name })
                              : formatAdminMessage(table.activateNamed, {
                                  name,
                                })
                          }
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                              isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                      <td className={ADMIN_TABLE_TD_CENTER}>
                        <span className="text-sm text-gray-600">
                          {formatCreated(user.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
