"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontHeroSlide } from "@/features/hero/application/queries";

type HomeHeroProps = {
  slides: StorefrontHeroSlide[];
  fallbackTitle: string;
  fallbackSubtitle: string;
  fallbackCtaLabel: string;
  fallbackCtaHref: string;
};

function isInternalHref(href: string): boolean {
  return href.startsWith("/");
}

export function HomeHero({
  slides,
  fallbackCtaLabel,
  fallbackCtaHref,
}: HomeHeroProps) {
  const [index, setIndex] = useState(0);
  const hasSlides = slides.length > 0;
  const active = hasSlides ? slides[index] : null;
  const ctaLabel = active?.copy.buttonLabel ?? fallbackCtaLabel;
  const ctaHref = active?.copy.buttonUrl ?? fallbackCtaHref;
  const slideImage = active?.desktopImageUrl ?? active?.mobileImageUrl;

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
    <section className="relative w-full overflow-hidden bg-brand-red">
      <div className="relative mx-auto h-[min(92vw,640px)] w-full sm:h-[680px] lg:h-[888px]">
        <Image
          src="/assets/home/hero-flame.svg"
          alt=""
          width={2474}
          height={888}
          priority
          className="pointer-events-none absolute inset-x-[-20%] top-[10%] h-[90%] w-[140%] max-w-none object-contain opacity-90"
        />

        <Image
          src="/assets/home/hero-logo.svg"
          alt="Grill.am"
          width={906}
          height={239}
          priority
          className="pointer-events-none absolute top-[22%] left-1/2 w-[min(78%,906px)] -translate-x-1/2 object-contain"
        />

        <Image
          src="/assets/home/hero-accent.svg"
          alt=""
          width={187}
          height={192}
          className="pointer-events-none absolute top-[18%] right-[12%] hidden w-[7%] max-w-[110px] xl:block"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[26%] mx-auto flex items-end justify-center">
          {slideImage ? (
            <div className="relative h-[72%] w-[min(90%,640px)]">
              <Image
                src={slideImage}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 640px"
                className="object-contain object-bottom drop-shadow-2xl"
              />
            </div>
          ) : (
            <>
              <div className="absolute bottom-[-6%] left-[4%] hidden h-[52%] w-[28%] lg:block">
                <Image
                  src="/assets/home/hero-chicken.png"
                  alt=""
                  fill
                  sizes="28vw"
                  className="object-contain object-bottom opacity-95"
                />
              </div>
              <div className="relative h-[74%] w-[min(92%,680px)]">
                <Image
                  src="/assets/home/hero-chicken.png"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 680px"
                  className="object-contain object-bottom drop-shadow-2xl"
                />
              </div>
              <div className="absolute right-[2%] bottom-[-4%] hidden h-[58%] w-[30%] lg:block">
                <Image
                  src="/assets/home/hero-chicken.png"
                  alt=""
                  fill
                  sizes="30vw"
                  className="object-contain object-bottom opacity-95"
                />
              </div>
            </>
          )}
        </div>

        <div className="absolute bottom-[12%] left-1/2 z-10 -translate-x-1/2 sm:bottom-[14%]">
          {isInternalHref(ctaHref) ? (
            <AppLink
              href={ctaHref}
              prefetchPolicy="intent"
              className="inline-flex h-14 min-w-[193px] items-center justify-center rounded-[28px] bg-white px-6 text-base font-extrabold tracking-wide text-brand-red uppercase transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {ctaLabel}
            </AppLink>
          ) : (
            <a
              href={ctaHref}
              className="inline-flex h-14 min-w-[193px] items-center justify-center rounded-[28px] bg-white px-6 text-base font-extrabold tracking-wide text-brand-red uppercase transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {ctaLabel}
            </a>
          )}
        </div>

        {slides.length > 1 ? (
          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
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
    </section>
  );
}
