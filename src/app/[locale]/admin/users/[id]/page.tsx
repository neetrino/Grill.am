import {
  CalendarDays,
  CircleCheckBig,
  LogIn,
  Mail,
  MailCheck,
  Phone,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { AdminDetailField } from "@/features/admin/ui/AdminDetailField";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import { getAdminUserById } from "@/features/users/application/queries";
import {
  getEligibleUserStatuses,
  isUserRole,
  isUserStatus,
} from "@/features/users/domain/user-lifecycle";
import { AdminUserRecentOrders } from "@/features/users/ui/AdminUserRecentOrders";
import {
  adminUserRoleLabel,
  adminUserStatusLabel,
} from "@/features/users/ui/admin-user-labels";
import { UpdateUserRoleForm } from "@/features/users/ui/UpdateUserRoleForm";
import { UpdateUserStatusForm } from "@/features/users/ui/UpdateUserStatusForm";
import {
  formatAppDateTimeMinutes,
  formatAppDisplayDate,
} from "@/lib/datetime/app-timezone";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminUserDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

const FIELD_ICON_CLASS = "h-4 w-4";

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
      </div>

      <Card
        className={`mb-4 !border-0 !shadow-none p-5 sm:p-6 ${ADMIN_CARD_CLASS}`}
      >
        <div className="grid gap-4 md:grid-cols-2 md:gap-x-10">
          <AdminDetailField
            icon={<Shield className={FIELD_ICON_CLASS} />}
            label={detailCopy.role}
          >
            <span
              className={`${ADMIN_BADGE} ${userRoleBadgeClass(user.role)}`}
            >
              {adminUserRoleLabel(user.role, copy.roles)}
            </span>
          </AdminDetailField>
          <AdminDetailField
            icon={<CircleCheckBig className={FIELD_ICON_CLASS} />}
            label={detailCopy.status}
          >
            <span
              className={`${ADMIN_BADGE} ${userStatusBadgeClass(user.status)}`}
            >
              {adminUserStatusLabel(user.status, copy.statuses)}
            </span>
          </AdminDetailField>
          <AdminDetailField
            icon={<Mail className={FIELD_ICON_CLASS} />}
            label={detailCopy.email}
          >
            {user.email}
          </AdminDetailField>
          <AdminDetailField
            icon={<Phone className={FIELD_ICON_CLASS} />}
            label={detailCopy.phone}
          >
            {user.phone ?? common.dash}
          </AdminDetailField>
          <AdminDetailField
            icon={<MailCheck className={FIELD_ICON_CLASS} />}
            label={detailCopy.emailVerified}
          >
            {user.emailVerifiedAt
              ? formatAppDisplayDate(user.emailVerifiedAt)
              : common.no}
          </AdminDetailField>
          <AdminDetailField
            icon={<LogIn className={FIELD_ICON_CLASS} />}
            label={detailCopy.lastLogin}
          >
            {user.lastLoginAt
              ? formatAppDateTimeMinutes(user.lastLoginAt)
              : common.never}
          </AdminDetailField>
          <AdminDetailField
            icon={<CalendarDays className={FIELD_ICON_CLASS} />}
            label={detailCopy.created}
          >
            {formatAppDisplayDate(user.createdAt)}
          </AdminDetailField>
        </div>
      </Card>

      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-stretch">
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

      <AdminUserRecentOrders locale={locale} orders={recentOrders} />
    </section>
  );
}
