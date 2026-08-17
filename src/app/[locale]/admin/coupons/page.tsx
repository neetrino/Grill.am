import Link from "next/link";
import { notFound } from "next/navigation";

import {
  listAdminPromotions,
  listCouponUserOptions,
} from "@/features/promotions/application/queries";
import { adminPromotionsFilterSchema } from "@/features/promotions/schemas/admin-promotions";
import { AdminCouponsView } from "@/features/promotions/ui/AdminCouponsView";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminCouponsPageProps = {
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

export default async function AdminCouponsPage({
  params,
  searchParams,
}: AdminCouponsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const common = getDictionary(locale).admin.common;
  const raw = await searchParams;
  const parsed = adminPromotionsFilterSchema.safeParse({
    kind: "COUPON",
    q: firstParam(raw.q) || undefined,
    active: firstParam(raw.active) || undefined,
    page: firstParam(raw.page) ?? "1",
  });

  const filters = parsed.success
    ? parsed.data
    : {
        kind: "COUPON" as const,
        page: 1 as const,
        q: undefined,
        active: undefined,
      };

  const [{ rows, total, pageSize }, users] = await Promise.all([
    listAdminPromotions(filters),
    listCouponUserOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AdminCouponsView locale={locale} coupons={rows} users={users} />
      {totalPages > 1 ? (
        <nav className="mt-4 flex items-center gap-3 text-sm text-gray-700">
          {filters.page > 1 ? (
            <Link
              href={`/${locale}/admin/coupons?page=${filters.page - 1}`}
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
              href={`/${locale}/admin/coupons?page=${filters.page + 1}`}
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
