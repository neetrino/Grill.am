import Image from "next/image";
import { Heart, LogIn } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";

/** Local `public/` asset — not on R2 yet; do not wrap with `staticAssetUrl`. */
const EMPTY_WISHLIST_MASCOT_SRC = "/assets/wishlist/empty-wishlist-flame.png";
const EMPTY_WISHLIST_MASCOT_WIDTH = 416;
const EMPTY_WISHLIST_MASCOT_HEIGHT = 587;

type WishlistEmptyStateProps = {
  title: string;
  hint: string;
  actionLabel: string;
  actionHref: string;
  /** Heart for empty wishlist; login for guests. */
  actionIcon?: "heart" | "login";
};

/** Empty / guest wishlist — brand illustration, copy and primary CTA. */
export function WishlistEmptyState({
  title,
  hint,
  actionLabel,
  actionHref,
  actionIcon = "heart",
}: WishlistEmptyStateProps) {
  const ActionIcon = actionIcon === "login" ? LogIn : Heart;

  return (
    <div className="flex min-h-[380px] flex-1 flex-col items-center justify-center gap-6 px-2 py-6 text-center sm:min-h-[440px] sm:gap-8 sm:py-10">
      <Image
        src={EMPTY_WISHLIST_MASCOT_SRC}
        alt=""
        width={EMPTY_WISHLIST_MASCOT_WIDTH}
        height={EMPTY_WISHLIST_MASCOT_HEIGHT}
        sizes="248px"
        unoptimized
        priority
        className="-mt-2 h-[220px] w-auto sm:h-[248px]"
        aria-hidden
      />

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold tracking-tight text-[#101828] sm:text-xl">
          {title}
        </h2>
        <p className="max-w-[420px] text-sm text-gray-600 sm:text-base">
          {hint}
        </p>
      </div>

      <AppLink
        href={actionHref}
        prefetchPolicy="intent"
        className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
      >
        <ActionIcon className="size-4 shrink-0" aria-hidden />
        {actionLabel}
      </AppLink>
    </div>
  );
}
