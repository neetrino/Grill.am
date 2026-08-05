import { Heart } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";

type WishlistEmptyStateProps = {
  title: string;
  hint: string;
  catalogLabel: string;
  catalogHref: string;
};

/** Empty wishlist content — brand illustration, copy and catalog CTA. */
export function WishlistEmptyState({
  title,
  hint,
  catalogLabel,
  catalogHref,
}: WishlistEmptyStateProps) {
  return (
    <div className="flex min-h-[380px] flex-1 flex-col items-center justify-center gap-6 px-2 py-6 text-center sm:min-h-[440px] sm:gap-8 sm:py-10">
      <div
        className="relative flex size-[168px] items-center justify-center rounded-full bg-brand-yellow sm:size-[200px]"
        aria-hidden
      >
        <Heart
          className="size-20 fill-none text-white sm:size-24"
          strokeWidth={2.25}
        />
        <span className="absolute top-[22%] right-[18%] size-3 rounded-full bg-white/70 sm:size-[14px]" />
        <span className="absolute bottom-[24%] left-[16%] size-2 rounded-full bg-white/50 sm:size-2.5" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold tracking-tight text-[#101828] sm:text-xl">
          {title}
        </h2>
        <p className="max-w-[420px] text-sm text-gray-600 sm:text-base">
          {hint}
        </p>
      </div>

      <AppLink
        href={catalogHref}
        prefetchPolicy="intent"
        className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
      >
        <Heart className="size-4 shrink-0" aria-hidden />
        {catalogLabel}
      </AppLink>
    </div>
  );
}
