"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontHeroSlide } from "@/features/hero/application/queries";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

type HomeHeroProps = {
  slides: StorefrontHeroSlide[];
  fallbackTitle: string;
  fallbackSubtitle: string;
  fallbackCtaLabel: string;
  fallbackCtaHref: string;
};

const HERO_CHICKEN = staticAssetUrl("/assets/home/hero-chicken.webp");
const HERO_FLAME = staticAssetUrl("/assets/home/hero-flame.webp");
const HERO_LOGO = staticAssetUrl("/assets/home/hero-logo.webp");
const HERO_ACCENT = staticAssetUrl("/assets/home/hero-accent.webp");

/**
 * Figma `165:1671` — white pill CTA (desktop).
 */
function HeroMenuButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  if (href.startsWith("/")) {
    return (
      <AppLink href={href} prefetchPolicy="intent" className={className}>
        {label}
      </AppLink>
    );
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}

/**
 * Figma `165:1670` / Component 4 — layout from Dev Mode CSS.
 */
function HeroChickenCollage() {
  return (
    <div
      className="pointer-events-none absolute top-[29.47%] left-1/2 z-[2] h-[88.88%] w-[96.18%] max-w-[1385px] -translate-x-1/2"
      aria-hidden
    >
      <div className="absolute top-0 right-[26%] left-[20.05%] h-[78.25%] overflow-hidden">
        <Image
          src={HERO_CHICKEN}
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 70vw, 747px"
          className="object-contain"
        />
      </div>

      <div className="absolute top-[41.82%] right-[63.35%] left-0 hidden h-[56.27%] overflow-hidden lg:block">
        <Image
          src={HERO_CHICKEN}
          alt=""
          fill
          sizes="37vw"
          className="object-cover"
        />
      </div>

      <div className="absolute top-[31.98%] right-0 left-[52.05%] hidden h-[71.09%] overflow-hidden lg:block">
        <Image
          src={HERO_CHICKEN}
          alt=""
          fill
          sizes="48vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}

/**
 * Figma mobile home hero `164:398` — red rounded card.
 */
function MobileHeroCard({
  subtitle,
  ctaLabel,
  ctaHref,
  slideImage,
}: {
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  slideImage: string | null;
}) {
  return (
    <section className="px-4 pt-2 md:hidden">
      <div className="relative min-h-[280px] overflow-hidden rounded-[24px] bg-brand-red">
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden>
          <Image
            src={HERO_FLAME}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="pointer-events-none absolute top-[calc(32%+2px)] -right-[6%] h-[78%] w-[62%] overflow-hidden">
          <div className="relative h-full w-full scale-110">
            <Image
              src={slideImage ?? HERO_CHICKEN}
              alt=""
              fill
              priority
              sizes="65vw"
              className="object-contain object-bottom"
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-start px-5 pt-6 pb-5">
          <div className="relative h-[111px] w-full max-w-[280px]">
            <Image
              src={HERO_LOGO}
              alt="Grill.am"
              fill
              priority
              sizes="280px"
              className="object-contain object-left"
            />
          </div>

          <p className="mt-1 text-[13px] leading-[19.5px] text-white/70">
            {subtitle}
          </p>

          <HeroMenuButton
            href={ctaHref}
            label={ctaLabel}
            className="mt-8 inline-flex h-[44px] w-[162px] items-center justify-center rounded-full bg-white text-center text-[13px] leading-[19.5px] font-extrabold tracking-[0.32px] text-brand-red uppercase transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
        </div>
      </div>
    </section>
  );
}

export function HomeHero({
  slides,
  fallbackSubtitle,
  fallbackCtaLabel,
  fallbackCtaHref,
}: HomeHeroProps) {
  const [index, setIndex] = useState(0);
  const hasSlides = slides.length > 0;
  const active = hasSlides ? slides[index] : null;
  const ctaLabel = fallbackCtaLabel;
  const ctaHref = active?.copy.buttonUrl ?? fallbackCtaHref;
  const slideImage = active?.desktopImageUrl ?? active?.mobileImageUrl ?? null;
  const mobileSlideImage =
    active?.mobileImageUrl ?? active?.desktopImageUrl ?? null;

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <>
      <MobileHeroCard
        subtitle={fallbackSubtitle}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
        slideImage={mobileSlideImage}
      />

      <section className="relative hidden w-full overflow-hidden bg-brand-red md:block">
        <div className="relative mx-auto h-[clamp(400px,60vw,860px)] w-full max-w-[1440px] overflow-hidden lg:h-[860px]">
          <div className="absolute inset-x-0 top-[-20%] h-[125%]">
            <div className="pointer-events-none absolute inset-[13.4%_-34.36%_2.18%_-37.43%] z-0">
              <Image
                src={HERO_FLAME}
                alt=""
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            <div className="pointer-events-none absolute inset-[26.53%_18.58%_50.76%_18.54%] z-[1]">
              <Image
                src={HERO_LOGO}
                alt="Grill.am"
                fill
                priority
                sizes="(max-width: 1440px) 63vw, 906px"
                className="object-contain"
              />
            </div>

            <div className="pointer-events-none absolute inset-[19.68%_21.46%_62.07%_65.56%] z-[1]">
              <Image
                src={HERO_ACCENT}
                alt=""
                fill
                sizes="13vw"
                className="object-contain"
              />
            </div>

            {slideImage ? (
              <div className="pointer-events-none absolute inset-x-[15%] top-[29.47%] bottom-0 z-[2]">
                <Image
                  src={slideImage}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 747px"
                  className="object-contain object-bottom"
                />
              </div>
            ) : (
              <HeroChickenCollage />
            )}

            <div className="absolute top-[61.22%] left-1/2 z-10 -translate-x-1/2">
              <HeroMenuButton
                href={ctaHref}
                label={ctaLabel}
                className="inline-flex h-14 w-[193px] shrink-0 items-center justify-center rounded-[28px] bg-white px-6 text-center text-base leading-[22.5px] font-extrabold tracking-wide whitespace-nowrap text-brand-red uppercase transition hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              />
            </div>

            {slides.length > 1 ? (
              <div className="absolute bottom-[3%] left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Go to slide ${slideIndex + 1}`}
                    aria-current={slideIndex === index}
                    className={
                      slideIndex === index
                        ? "h-2.5 w-7 rounded-full bg-white"
                        : "h-2.5 w-2.5 rounded-full bg-white/50"
                    }
                    onClick={() => setIndex(slideIndex)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
