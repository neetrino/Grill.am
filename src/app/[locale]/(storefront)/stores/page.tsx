import { notFound } from "next/navigation";

import { StoresPageView } from "@/features/stores/ui/StoresPageView";
import { getStoreAddresses } from "@/features/stores/yandex-map-embed";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type StoresPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function StoresPage({ params }: StoresPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);

  return (
    <div className="storefront-bleed -mt-10 mb-[-2.5rem] bg-[#f2f0f0] lg:min-h-[calc(100dvh/var(--desktop-layout-scale)-var(--storefront-header-offset))]">
      <StoresPageView
        addresses={getStoreAddresses(rawLocale)}
        copy={dictionary.stores}
      />
    </div>
  );
}
