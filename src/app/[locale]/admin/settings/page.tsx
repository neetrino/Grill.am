import { notFound } from "next/navigation";

import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  getStoreEnabledCurrencies,
  getStoreFxRates,
  getStoreIdentity,
} from "@/features/settings/application/queries";
import { StoreSettingsForms } from "@/features/settings/ui/StoreSettingsForms";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminSettingsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminSettingsPage({
  params,
}: AdminSettingsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getDictionary(locale).admin.settings;
  const [identity, fxRates, enabledCurrencies] = await Promise.all([
    getStoreIdentity(),
    getStoreFxRates(),
    getStoreEnabledCurrencies(),
  ]);

  return (
    <section>
      <div className="mb-6">
        <AdminPageTitle>{copy.title}</AdminPageTitle>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>{copy.subtitle}</p>
      </div>

      <StoreSettingsForms
        locale={locale}
        identity={identity}
        fxRates={fxRates}
        enabledCurrencies={enabledCurrencies}
      />
    </section>
  );
}
