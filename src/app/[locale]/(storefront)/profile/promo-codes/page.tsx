import Link from "next/link";
import { notFound } from "next/navigation";

import { listCustomerCouponHistory } from "@/features/promotions/application/list-customer-coupon-history";
import { CustomerPromoCodesView } from "@/features/promotions/ui/CustomerPromoCodesView";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type PromoCodesPageProps = {
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

function parsePage(raw: string | undefined): number {
  const n = Number(raw ?? "1");
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.floor(n);
}

export default async function PromoCodesPage({
  params,
  searchParams,
}: PromoCodesPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await requireUser(locale);
  const dictionary = getDictionary(locale);
  const copy = dictionary.profile.promoCodes;
  const raw = await searchParams;
  const page = parsePage(firstParam(raw.page));

  const { rows, total, pageSize } = await listCustomerCouponHistory(
    user.id,
    page,
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <CustomerPromoCodesView
        locale={locale}
        rows={rows}
        labels={{
          title: copy.title,
          description: copy.description,
          code: copy.code,
          offer: copy.offer,
          saved: copy.saved,
          order: copy.order,
          status: copy.status,
          date: copy.date,
          empty: copy.empty,
          emptyHint: copy.emptyHint,
          pageCount: copy.pageCount,
        }}
      />

      {totalPages > 1 ? (
        <nav className="flex items-center gap-3 text-sm text-gray-700">
          {page > 1 ? (
            <Link
              href={`/${locale}/profile/promo-codes?page=${page - 1}`}
              className="font-medium hover:underline"
            >
              {copy.previous}
            </Link>
          ) : null}
          <span>
            {copy.pageLabel
              .replace("{page}", String(page))
              .replace("{total}", String(totalPages))}
          </span>
          {page < totalPages ? (
            <Link
              href={`/${locale}/profile/promo-codes?page=${page + 1}`}
              className="font-medium hover:underline"
            >
              {copy.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
