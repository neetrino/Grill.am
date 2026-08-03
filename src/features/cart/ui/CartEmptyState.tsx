import { ShoppingCart } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";

type CartEmptyStateProps = {
  title: string;
  catalogLabel: string;
  catalogHref: string;
  onCatalogClick?: () => void;
};

/** Empty cart content — illustration, copy, catalog CTA (drawer / sidebar). */
export function CartEmptyState({
  title,
  catalogLabel,
  catalogHref,
  onCatalogClick,
}: CartEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-2 py-6 pt-10 text-center sm:gap-10 sm:pt-14">
      <div
        className="-mt-6 flex size-[168px] items-center justify-center rounded-full bg-brand-yellow sm:-mt-8 sm:size-[200px]"
        aria-hidden
      >
        <ShoppingCart
          className="-translate-x-[5px] size-20 text-white sm:size-24"
          strokeWidth={2.25}
        />
      </div>

      <h3 className="text-lg font-bold tracking-tight text-[#101828] sm:text-xl">
        {title}
      </h3>

      <AppLink
        href={catalogHref}
        prefetchPolicy="intent"
        onClick={onCatalogClick}
        className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
      >
        <ShoppingCart className="size-4 shrink-0" aria-hidden />
        {catalogLabel}
      </AppLink>
    </div>
  );
}
