import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { LimitedOfferFireIcon } from "@/features/home/ui/LimitedOfferFireIcon";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

type HomePromotionsProps = {
  limitedOfferLabel: string;
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  line1: string;
  line2: string;
  ctaLabel: string;
  ctaHref: string;
};

/** Figma `164:559` grilled chicken for promo banners. */
const PROMO_CHICKEN = staticAssetUrl("/assets/home/promo-banner-chicken.webp");

/**
 * Figma mobile promo section `164:557` — dark card, chicken only.
 */
function MobilePromoCard({
  limitedOfferLabel,
  eyebrow,
  titleLead,
  titleAccent,
  ctaLabel,
  linkHref,
}: {
  limitedOfferLabel: string;
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  ctaLabel: string;
  linkHref: string;
}) {
  return (
    <div className="relative h-[334px] min-h-[200px] overflow-hidden rounded-[24px] bg-[#171717]">
      {/*
        Figma `164:558` chicken — absolute box 146/-12 / 401×368 on 358 frame,
        then CSS `-scale-y-100 rotate-[-146.47deg]` around 337×218 clip.
      */}
      <div
        className="pointer-events-none absolute top-[-12px] left-[40.8%] flex h-[368px] w-[112%] items-center justify-center"
        aria-hidden
      >
        <div className="-scale-y-100 rotate-[-146.47deg]">
          <div className="relative h-[218px] w-[337px] overflow-hidden">
            <div className="relative h-[202px] w-[347px]">
              <Image
                src={PROMO_CHICKEN}
                alt=""
                fill
                sizes="90vw"
                className="object-cover"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex h-full flex-col justify-center px-5 py-5">
        <div className="flex max-w-[62%] flex-col">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-red-hot px-3 py-1 text-[10px] leading-[15px] font-black tracking-[1.4px] text-[#0d0d0d] uppercase">
            <LimitedOfferFireIcon className="h-3 w-[11px] shrink-0" />
            {limitedOfferLabel}
          </span>

          <p className="mt-4 text-[22px] leading-[33px] font-black tracking-[2.2px] text-white/90 uppercase">
            {eyebrow}
          </p>

          <h2 className="mt-3 text-[38px] leading-[38px] font-black uppercase">
            <span className="block text-white">{titleLead}</span>
            <span className="block text-brand-red">{titleAccent}</span>
          </h2>
        </div>

        <div className="z-20 mt-5">
          <AppLink
            href={linkHref}
            prefetchPolicy="intent"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-[#171717] px-[21px] py-[13px] text-[12px] leading-[18px] font-black tracking-[0.9px] text-white uppercase"
          >
            {ctaLabel}
          </AppLink>
        </div>
      </div>
    </div>
  );
}

export function HomePromotions({
  limitedOfferLabel,
  eyebrow,
  titleLead,
  titleAccent,
  line1,
  line2,
  ctaLabel,
  ctaHref,
}: HomePromotionsProps) {
  return (
    <section className="relative w-full py-5 md:py-10 lg:py-12">
      <div className="page-container">
        <div className="lg:hidden">
          <MobilePromoCard
            limitedOfferLabel={limitedOfferLabel}
            eyebrow={eyebrow}
            titleLead={titleLead}
            titleAccent={titleAccent}
            ctaLabel={ctaLabel}
            linkHref={ctaHref}
          />
        </div>

        <div className="mx-auto hidden w-full max-w-[1296px] lg:block">
          <div className="relative h-[553px] overflow-hidden rounded-[30px] bg-[#ffc12c]">
            <div className="relative z-10 flex h-full max-w-[55%] flex-col justify-center gap-6 px-14">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f52516] px-4 py-1.5 text-xs font-black tracking-[1.44px] text-[#0d0d0d] uppercase">
                <LimitedOfferFireIcon className="h-3.5 w-3.5 shrink-0" />
                {limitedOfferLabel}
              </span>

              <p className="text-[36px] leading-9 font-black tracking-[2.88px] text-[#0d0d0d] uppercase">
                {eyebrow}
              </p>

              <h2 className="text-[90px] leading-[100px] font-black tracking-[-3.31px] text-white uppercase">
                {titleLead}{" "}
                <span className="text-[#db0b20]">{titleAccent}</span>
              </h2>

              <p className="text-lg leading-7 text-black/65">
                <span className="block">{line1}</span>
                <span className="block text-black">{line2}</span>
              </p>

              <AppLink
                href={ctaHref}
                prefetchPolicy="intent"
                className="mt-0 inline-flex h-14 w-fit items-center rounded-[96px] bg-[#171717] px-8 text-[15px] font-black tracking-[0.9px] text-white uppercase transition hover:bg-black"
              >
                {ctaLabel}
              </AppLink>
            </div>

            {/*
              Figma `165:1524` — chicken art is 542×436 inside the 1296×553
              card. The source webp is square with ~15% transparent padding,
              so the box is oversized and overflows the card (clipped padding
              only) to reach the design's visual size.
            */}
            <div className="pointer-events-none absolute top-1/2 right-[-7%] aspect-square w-[57%] -translate-y-1/2">
              <Image
                src={PROMO_CHICKEN}
                alt=""
                fill
                sizes="740px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
