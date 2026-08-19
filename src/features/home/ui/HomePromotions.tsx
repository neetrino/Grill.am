import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { LimitedOfferFireIcon } from "@/features/home/ui/LimitedOfferFireIcon";

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

const PROMO_MEAL = "/assets/home/promo-banner-meal.webp";

function lastWordAccent(text: string): { lead: string; accent: string } {
  const trimmed = text.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace === -1) {
    return { lead: "", accent: trimmed };
  }
  return {
    lead: trimmed.slice(0, lastSpace),
    accent: trimmed.slice(lastSpace + 1),
  };
}

/**
 * Mobile promo card — full meal photo instead of the dark fill.
 */
function MobilePromoCard({
  limitedOfferLabel,
  eyebrow,
  ctaLabel,
  linkHref,
}: {
  limitedOfferLabel: string;
  eyebrow: string;
  ctaLabel: string;
  linkHref: string;
}) {
  const { lead: eyebrowLead, accent: eyebrowAccent } = lastWordAccent(eyebrow);

  return (
    <div className="relative h-[334px] min-h-[200px] overflow-hidden rounded-[24px] bg-[#e8e0d4]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={PROMO_MEAL}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority={false}
        />
      </div>

      <span className="absolute top-4 left-4 z-20 inline-flex w-fit items-center gap-2 rounded-full bg-brand-red-hot px-3.5 py-1.5 text-[12px] leading-[16px] font-black tracking-[1.4px] text-[#0d0d0d] uppercase">
        <LimitedOfferFireIcon className="h-3.5 w-[13px] shrink-0" />
        {limitedOfferLabel}
      </span>

      <p className="absolute bottom-4 left-4 z-20 max-w-[55%] text-[22px] leading-[28px] font-black tracking-[2.2px] text-[#0d0d0d] uppercase">
        {eyebrowLead ? `${eyebrowLead} ` : null}
        <span className="text-brand-red">{eyebrowAccent}</span>
      </p>

      <AppLink
        href={linkHref}
        prefetchPolicy="intent"
        className="absolute right-4 bottom-4 z-20 inline-flex items-center justify-center rounded-full bg-[#171717] px-[21px] py-[13px] text-[12px] leading-[18px] font-black tracking-[0.9px] text-white uppercase"
      >
        {ctaLabel}
      </AppLink>
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
            ctaLabel={ctaLabel}
            linkHref={ctaHref}
          />
        </div>

        <div className="hidden w-full lg:block">
          <div className="relative h-[553px] overflow-hidden rounded-[30px] bg-[#ffc12c]">
            <div className="relative z-10 flex h-full max-w-[55%] flex-col justify-center gap-8 px-14">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f52516] px-4 py-1.5 text-xs leading-none font-black tracking-[1.44px] text-[#0d0d0d] uppercase">
                <LimitedOfferFireIcon className="h-3.5 w-3.5 shrink-0" />
                {limitedOfferLabel}
              </span>

              <p className="text-[30px] leading-none font-black tracking-[2.4px] text-[#0d0d0d] uppercase">
                {eyebrow}
              </p>

              <h2 className="text-[76px] leading-none font-black tracking-[-2.8px] text-white uppercase">
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
                className="inline-flex h-14 w-fit items-center rounded-[96px] bg-[#171717] px-8 text-[15px] font-black tracking-[0.9px] text-white uppercase transition hover:bg-black"
              >
                {ctaLabel}
              </AppLink>
            </div>

            <div className="pointer-events-none absolute inset-y-6 right-0 w-[46%]">
              <Image
                src={PROMO_MEAL}
                alt=""
                fill
                sizes="620px"
                className="object-contain object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
