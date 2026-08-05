import { notFound } from "next/navigation";

import { StoresPageView } from "@/features/stores/ui/StoresPageView";
import {
  getStoreAddresses,
  getStoreIndexById,
} from "@/features/stores/yandex-map-embed";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type StoresPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readStoreId(
  searchParams: Record<string, string | string[] | undefined>,
): string | null {
  const raw = searchParams.store;
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string") {
    return raw[0];
  }
  return null;
}

export default async function StoresPage({
  params,
  searchParams,
}: StoresPageProps) {
  const { locale: rawLocale } = await params;
  const rawSearch = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const initialSelectedIndex = getStoreIndexById(readStoreId(rawSearch));

  return (
    <div className="storefront-bleed -mt-10 mb-[-2.5rem] min-h-full bg-white lg:[@media(hover:hover)_and_(pointer:fine)]:min-h-[calc(100dvh-var(--storefront-header-offset))]">
      <StoresPageView
        addresses={getStoreAddresses(rawLocale)}
        copy={dictionary.stores}
        initialSelectedIndex={initialSelectedIndex}
      />
    </div>
  );
}
