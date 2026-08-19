import type { HomeBranchItem } from "@/features/home/ui/HomeBranches";
import type { StorefrontBranch } from "@/features/stores/application/queries";
import {
  buildStoresPageHref,
  GRILL_STORE_LOCATIONS,
} from "@/features/stores/yandex-map-embed";
import type { Locale } from "@/lib/i18n/config";

function titleFromAddress(address: string): string {
  return address.replace(/\s+\d.*$/, "").trim() || address;
}

/** Hardcoded catalog used when the CMS table is empty. */
export function fallbackStorefrontBranches(
  locale: Locale,
): StorefrontBranch[] {
  return GRILL_STORE_LOCATIONS.map((store) => {
    const address = store.address[locale];
    return {
      slug: store.id,
      title: titleFromAddress(address),
      address,
      phone: null,
      imageUrl: null,
    };
  });
}

/** Maps CMS/fallback branches to home-page cards. */
export function toHomeBranchItems(
  locale: Locale,
  branches: readonly StorefrontBranch[],
  fallbackPhone: string,
): HomeBranchItem[] {
  return branches.map((branch) => ({
    id: branch.slug,
    href: buildStoresPageHref(locale, branch.slug),
    title: branch.title,
    address: branch.address,
    phone: branch.phone ?? fallbackPhone,
    imageUrl: branch.imageUrl,
  }));
}
