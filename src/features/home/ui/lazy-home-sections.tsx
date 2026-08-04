"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { LazyWhenVisible } from "@/components/ui/LazyWhenVisible";

const HomeFeaturedProducts = dynamic(
  () =>
    import("@/features/home/ui/HomeFeaturedProducts").then((mod) => ({
      default: mod.HomeFeaturedProducts,
    })),
  {
    loading: () => (
      <div
        className="min-h-[480px] w-full rounded-[30px] bg-brand-yellow-soft/50"
        aria-hidden
      />
    ),
  },
);

const HomePromotions = dynamic(
  () =>
    import("@/features/home/ui/HomePromotions").then((mod) => ({
      default: mod.HomePromotions,
    })),
  {
    loading: () => (
      <div
        className="mx-auto min-h-[420px] w-full max-w-[1296px] rounded-[30px] bg-[#ffc12c]/70"
        aria-hidden
      />
    ),
  },
);

const HomeFeatures = dynamic(
  () =>
    import("@/features/home/ui/HomeFeatures").then((mod) => ({
      default: mod.HomeFeatures,
    })),
  {
    loading: () => (
      <div className="min-h-[300px] w-full sm:min-h-[360px] lg:min-h-[421px]" aria-hidden />
    ),
  },
);

type FeaturedProps = ComponentProps<typeof HomeFeaturedProducts>;
type PromotionsProps = ComponentProps<typeof HomePromotions>;
type FeaturesProps = ComponentProps<typeof HomeFeatures>;

/** Featured grid — near-fold on mobile; preload early via rootMargin. */
export function HomeFeaturedProductsLazy(props: FeaturedProps) {
  return (
    <LazyWhenVisible minHeight={480} rootMargin="520px 0px">
      <HomeFeaturedProducts {...props} />
    </LazyWhenVisible>
  );
}

/** Promo band — further below the fold. */
export function HomePromotionsLazy(props: PromotionsProps) {
  return (
    <LazyWhenVisible minHeight={420} rootMargin="400px 0px">
      <HomePromotions {...props} />
    </LazyWhenVisible>
  );
}

/** Why-choose — static 2-col on tablet; animated track from lg. */
export function HomeFeaturesLazy(props: FeaturesProps) {
  return (
    <div className="hidden md:block">
      <LazyWhenVisible minHeight={300} rootMargin="360px 0px">
        <HomeFeatures {...props} />
      </LazyWhenVisible>
    </div>
  );
}
