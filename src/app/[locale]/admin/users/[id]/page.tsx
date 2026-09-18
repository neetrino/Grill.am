import {
  CalendarDays,
  CircleCheckBig,
  Gift,
  Mail,
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
import { getAdminUserById } from "@/features/users/application/queries";
import {
  getEligibleUserStatuses,
  isUserRole,
  isUserStatus,
} from "@/features/users/domain/user-lifecycle";
import { AdminUserBonusSection } from "@/features/users/ui/AdminUserBonusSection";
import { AdminUserRecentOrders } from "@/features/users/ui/AdminUserRecentOrders";
import { UpdateUserRoleForm } from "@/features/users/ui/UpdateUserRoleForm";
import { UpdateUserStatusForm } from "@/features/users/ui/UpdateUserStatusForm";
import { formatAppDisplayDate } from "@/lib/datetime/app-timezone";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

type AdminUserDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

const FIELD_ICON_CLASS = "h-4 w-4";

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

  const { user, recentOrders, bonus } = detail;
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
          </AdminDetailField>
          <AdminDetailField
            icon={<CircleCheckBig className={FIELD_ICON_CLASS} />}
            label={detailCopy.status}
          >
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
            icon={<CalendarDays className={FIELD_ICON_CLASS} />}
            label={detailCopy.created}
          >
            {formatAppDisplayDate(user.createdAt)}
          </AdminDetailField>
          <AdminDetailField
            icon={<Gift className={FIELD_ICON_CLASS} />}
            label={detailCopy.bonusBalance}
          >
            <span className="font-semibold tabular-nums text-gray-900">
              {formatMoneyAmount(bonus.balanceAmount, "AMD", locale)}
            </span>
          </AdminDetailField>
        </div>
      </Card>

      <AdminUserBonusSection
        locale={locale}
        balanceAmount={bonus.balanceAmount}
        totalEarnedAmount={bonus.totalEarnedAmount}
        totalSpentAmount={bonus.totalSpentAmount}
        ledger={bonus.ledger}
      />

      <AdminUserRecentOrders locale={locale} orders={recentOrders} />
    </section>
  );
}
