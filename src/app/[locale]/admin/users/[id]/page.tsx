import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  ADMIN_BADGE,
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import {
  adminOrderStatusLabel,
  adminPaymentStatusLabel,
} from "@/features/orders/ui/admin-order-status-labels";
import { getAdminUserById } from "@/features/users/application/queries";
import {
  formatAppDateTimeMinutes,
  formatAppIsoDate,
} from "@/lib/datetime/app-timezone";
import {
  getEligibleUserStatuses,
  isUserRole,
  isUserStatus,
} from "@/features/users/domain/user-lifecycle";
import {
  adminUserRoleLabel,
  adminUserStatusLabel,
} from "@/features/users/ui/admin-user-labels";
import { UpdateUserRoleForm } from "@/features/users/ui/UpdateUserRoleForm";
import { UpdateUserStatusForm } from "@/features/users/ui/UpdateUserStatusForm";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminUserDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function userStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "ACTIVE") return "bg-green-100 text-green-800";
  if (normalized === "PENDING" || normalized === "INVITED") {
    return "bg-yellow-100 text-yellow-800";
  }
  if (
    normalized === "SUSPENDED" ||
    normalized === "BANNED" ||
    normalized === "ANONYMIZED"
  ) {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-800";
}

function userRoleBadgeClass(role: string): string {
  return role.toUpperCase() === "ADMIN"
    ? "bg-brand-red/10 text-brand-red"
    : "bg-gray-100 text-gray-800";
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const admin = getDictionary(locale).admin;
  const copy = admin.users;
  const detailCopy = copy.detail;
  const common = admin.common;
  const orderStatusLabels = admin.orders.status;
  const paymentStatusLabels = admin.orders.paymentStatus;

  const detail = await getAdminUserById(id);
  if (!detail) {
    notFound();
  }

  const { user, recentOrders } = detail;
  const role = isUserRole(user.role) ? user.role : null;
  const status = isUserStatus(user.status) ? user.status : null;
  const eligibleStatuses = status ? getEligibleUserStatuses(status) : [];
  const isAnonymized = status === "ANONYMIZED";

  return (
    <section>
      <div className="mb-6">
        <p className={`mb-1 ${ADMIN_PAGE_SUBTITLE}`}>
          <Link
            href={`/${locale}/admin/users`}
            className="font-medium text-gray-700 hover:underline"
          >
            {copy.title}
          </Link>
        </p>
        <AdminPageTitle>{`${user.firstName} ${user.lastName}`}</AdminPageTitle>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>{user.email}</p>
      </div>

      <Card className="mb-6 p-6">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <p className="text-gray-700">
            {detailCopy.role}:{" "}
            <span
              className={`${ADMIN_BADGE} ${userRoleBadgeClass(user.role)}`}
            >
              {adminUserRoleLabel(user.role, copy.roles)}
            </span>
          </p>
          <p className="text-gray-700">
            {detailCopy.status}:{" "}
            <span
              className={`${ADMIN_BADGE} ${userStatusBadgeClass(user.status)}`}
            >
              {adminUserStatusLabel(user.status, copy.statuses)}
            </span>
          </p>
          <p className="text-gray-700">
            {detailCopy.phone}: {user.phone ?? common.dash}
          </p>
          <p className="text-gray-700">
            {detailCopy.emailVerified}:{" "}
            {user.emailVerifiedAt
              ? formatAppIsoDate(user.emailVerifiedAt)
              : common.no}
          </p>
          <p className="text-gray-700">
            {detailCopy.lastLogin}:{" "}
            {user.lastLoginAt
              ? formatAppDateTimeMinutes(user.lastLoginAt)
              : common.never}{" "}
            {common.utc}
          </p>
          <p className="text-gray-700">
            {detailCopy.created}: {formatAppIsoDate(user.createdAt)}
          </p>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {role ? (
          <UpdateUserRoleForm
            locale={locale}
            userId={user.id}
            currentRole={role}
            disabled={isAnonymized}
          />
        ) : (
          <p className="text-sm text-red-700">{common.unknownRole}</p>
        )}
        {status ? (
          <UpdateUserStatusForm
            locale={locale}
            userId={user.id}
            currentStatus={status}
            eligibleStatuses={eligibleStatuses}
          />
        ) : (
          <p className="text-sm text-red-700">{common.unknownStatus}</p>
        )}
      </div>

      <Card className="p-6">
        <h2 className={`mb-4 ${ADMIN_SECTION_TITLE}`}>
          {detailCopy.recentOrders}
        </h2>
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/${locale}/admin/orders/${order.orderNumber}`}
              className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm text-gray-900">
                  {order.orderNumber}
                </strong>
                <span
                  className={`${ADMIN_BADGE} ${orderStatusBadgeClass(order.status)}`}
                >
                  {adminOrderStatusLabel(order.status, orderStatusLabels)}
                </span>
                <span
                  className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.paymentStatus)}`}
                >
                  {adminPaymentStatusLabel(
                    order.paymentStatus,
                    paymentStatusLabels,
                  )}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {order.totalAmount.toLocaleString("en-US")} {order.baseCurrency}
              </p>
            </Link>
          ))}
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-600">{detailCopy.noOrders}</p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
