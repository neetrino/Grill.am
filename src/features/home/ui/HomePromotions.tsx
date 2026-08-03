"use client";

import Image from "next/image";
import { useState } from "react";

import { AppLink } from "@/components/ui/AppLink";

type SpecialProduct = {
  title: string;
  href: string;
  priceFormatted: string;
  compareAtFormatted: string | null;
  imageUrl: string | null;
  saveFormatted: string | null;
};

type HomePromotionsProps = {
  limitedOfferLabel: string;
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  line1: string;
  line2: string;
  ctaLabel: string;
  ctaHref: string;
  onlyLabel: string;
  wasLabel: string;
  saveLabel: string;
  freshDealLabel: string;
  prevLabel: string;
  nextLabel: string;
  products: readonly SpecialProduct[];
};

const FALLBACK_PRODUCT: SpecialProduct = {
  title: "Grill combo",
  href: "#",
  priceFormatted: "8,300 ֏",
  compareAtFormatted: "4 200 ֏",
  imageUrl: "/assets/home/promo-chicken.png",
  saveFormatted: "700 ֏",
};

export function HomePromotions({
  limitedOfferLabel,
  eyebrow,
  titleLead,
  titleAccent,
  line1,
  line2,
  ctaLabel,
  ctaHref,
  onlyLabel,
  wasLabel,
  saveLabel,
  freshDealLabel,
  prevLabel,
  nextLabel,
  products,
}: HomePromotionsProps) {
  const slides = products.length > 0 ? products : [FALLBACK_PRODUCT];
  const [index, setIndex] = useState(0);
  const product = slides[index] ?? FALLBACK_PRODUCT;

  function goPrev(): void {
    setIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function goNext(): void {
    setIndex((current) => (current + 1) % slides.length);
  }

  const compareAtFormatted = product.compareAtFormatted ?? "4 200 ֏";
  const saveFormatted = product.saveFormatted ?? "700 ֏";
  const imageSrc = product.imageUrl ?? "/assets/home/promo-chicken.png";
  const linkHref = product.href.startsWith("/") ? product.href : ctaHref;

  return (
    <section className="relative w-full py-10 sm:py-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto w-full max-w-[1296px]">
          <button
            type="button"
            aria-label={prevLabel}
            onClick={goPrev}
            className="absolute top-1/2 left-0 z-20 size-14 -translate-x-1/2 -translate-y-1/2 transition hover:scale-105"
          >
            <Image
              src="/assets/home/promo-arrow-left.svg"
              alt=""
              width={56}
              height={56}
              className="size-14"
            />
          </button>

          <button
            type="button"
            aria-label={nextLabel}
            onClick={goNext}
            className="absolute top-1/2 right-0 z-20 size-14 translate-x-1/2 -translate-y-1/2 transition hover:scale-105"
          >
            <Image
              src="/assets/home/promo-arrow-left.svg"
              alt=""
              width={56}
              height={56}
              className="size-14 rotate-180"
            />
          </button>

          {/* Figma PromoSection 165:1522 — 1296 × 553, radius 30, #ffc12c */}
          <div className="relative h-auto min-h-[420px] overflow-hidden rounded-[30px] bg-[#ffc12c] sm:min-h-[480px] lg:h-[553px] lg:min-h-0">
            <div className="relative z-10 flex h-full flex-col justify-center gap-4 px-6 pt-14 pb-10 sm:gap-4 sm:px-10 sm:pt-16 sm:pb-12 lg:max-w-[55%] lg:justify-start lg:px-14 lg:pt-[88px] lg:pb-0">
              <span className="inline-flex w-fit items-center rounded-full bg-[#f52516] px-4 py-1.5 text-xs font-black tracking-[1.44px] text-[#0d0d0d] uppercase">
                {limitedOfferLabel}
              </span>

              <p className="text-[28px] leading-9 font-black tracking-[2.88px] text-[#0d0d0d] uppercase sm:text-[36px] sm:leading-9">
                {eyebrow}
              </p>

              <h2 className="text-[48px] leading-none font-black tracking-[-2px] text-white uppercase sm:text-[64px] lg:text-[90px] lg:leading-[100px] lg:tracking-[-3.31px]">
                {titleLead}{" "}
                <span className="text-[#db0b20]">{titleAccent}</span>
              </h2>

              <p className="text-base leading-7 text-black/65 sm:text-lg sm:leading-7">
                <span className="block">{line1}</span>
                <span className="block text-black">{line2}</span>
              </p>

              <AppLink
                href={linkHref}
                prefetchPolicy="intent"
                className="mt-2 inline-flex h-14 w-fit items-center rounded-[96px] bg-[#171717] px-8 text-[15px] font-black tracking-[0.9px] text-white uppercase transition hover:bg-black"
              >
                {ctaLabel}
              </AppLink>
            </div>

            <div className="pointer-events-none absolute inset-y-[40px] right-0 hidden w-[48%] translate-x-[-40px] lg:block">
              <div className="relative h-full w-full">
                <Image
                  src={imageSrc}
                  alt={product.title}
                  fill
                  sizes="542px"
                  className="object-contain object-right-bottom"
                />
              </div>
            </div>

            <div className="relative mx-auto mt-4 h-[260px] w-full max-w-md lg:hidden">
              <Image
                src={imageSrc}
                alt={product.title}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>

            <div className="absolute right-4 bottom-4 z-20 flex items-center gap-6 sm:right-8 sm:bottom-8 lg:right-[72px] lg:bottom-10">
              <div className="flex size-[112px] flex-col items-center justify-center rounded-full bg-[#db0b20]">
                <span className="text-xs font-black tracking-[0.6px] text-[#ffc12c] uppercase">
                  {onlyLabel}
                </span>
                <span className="text-xl font-black text-white">
                  {product.priceFormatted}
                </span>
              </div>
              <div className="hidden flex-col sm:flex">
                <p className="text-sm leading-5 text-white line-through">
                  {wasLabel.replace("{price}", compareAtFormatted)}
                </p>
                <p className="text-2xl leading-8 font-black text-[#db0b20]">
                  {saveLabel.replace("{amount}", saveFormatted)}
                </p>
                <p className="mt-1 text-xs leading-4 text-white">
                  {freshDealLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
