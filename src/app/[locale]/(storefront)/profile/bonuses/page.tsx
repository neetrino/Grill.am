import { notFound } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import {
  getCustomerBonusSummary,
  listCustomerBonusLedger,
} from "@/features/loyalty/application/queries";
import { CustomerBonusesPageContent } from "@/features/loyalty/ui/CustomerBonusesPageContent";
import { PROFILE_BTN_SECONDARY_CLASS } from "@/features/profile/ui/profile-ui";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type BonusesPageProps = {
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

export default async function ProfileBonusesPage({
  params,
  searchParams,
}: BonusesPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await requireUser(locale);
  const dictionary = getDictionary(locale);
  const copy = dictionary.profile.bonuses;
  const raw = await searchParams;
  const page = parsePage(firstParam(raw.page));

  const [summary, { rows, total, pageSize }] = await Promise.all([
    getCustomerBonusSummary(user.id),
    listCustomerBonusLedger(user.id, page),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <CustomerBonusesPageContent
        locale={locale}
        summary={summary}
        rows={rows}
        copy={copy}
        coinsLabel={dictionary.header.coins}
        startShoppingLabel={dictionary.profile.startShopping}
      />

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {copy.pageLabel
              .replace("{page}", String(page))
              .replace("{total}", String(totalPages))}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <AppLink
                href={`/${locale}/profile/bonuses?page=${page - 1}`}
                prefetchPolicy="intent"
                className={PROFILE_BTN_SECONDARY_CLASS}
              >
                {copy.previous}
              </AppLink>
            ) : null}
            {page < totalPages ? (
              <AppLink
                href={`/${locale}/profile/bonuses?page=${page + 1}`}
                prefetchPolicy="intent"
                className={PROFILE_BTN_SECONDARY_CLASS}
              >
                {copy.next}
              </AppLink>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
