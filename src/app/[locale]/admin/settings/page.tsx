import { notFound } from "next/navigation";

import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import {
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
  const [identity, fxRates] = await Promise.all([
    getStoreIdentity(),
    getStoreFxRates(),
  ]);

  return (
    <section>
      <div className="mb-6">
        <h1 className={ADMIN_PAGE_TITLE}>{copy.title}</h1>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>{copy.subtitle}</p>
      </div>

      <StoreSettingsForms
        locale={locale}
        identity={identity}
        fxRates={fxRates}
      />
    </section>
  );
}
