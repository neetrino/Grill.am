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

const HERO_CHICKEN = "/assets/home/hero-chicken.webp";

/**
 * Figma `165:1671` — white pill CTA.
 */
function HeroMenuButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const className =
    "inline-flex h-14 w-[193px] shrink-0 items-center justify-center rounded-[28px] bg-white px-6 text-center text-base leading-[22.5px] font-extrabold tracking-wide whitespace-nowrap text-[#db0b20] uppercase transition hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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
      {/* Center — left 20.05% / right 26% / height 731.6 */}
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

      {/* Left — width 36.65% / top 391 / height 526.1 */}
      <div className="absolute top-[41.82%] right-[63.35%] left-0 hidden h-[56.27%] overflow-hidden lg:block">
        <Image
          src={HERO_CHICKEN}
          alt=""
          fill
          sizes="37vw"
          className="object-cover"
        />
      </div>

      {/* Right — width 47.95% / top 299 / height 664.7 */}
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

export function HomeHero({
  slides,
  fallbackCtaLabel,
  fallbackCtaHref,
}: HomeHeroProps) {
  const [index, setIndex] = useState(0);
  const hasSlides = slides.length > 0;
  const active = hasSlides ? slides[index] : null;
  const ctaLabel = fallbackCtaLabel;
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
    <section className="relative w-full overflow-hidden bg-[#db0b20]">
      {/* Crop empty red from Figma top; inner stage keeps 1440×1052 layout. */}
      <div className="relative mx-auto h-[clamp(400px,60vw,860px)] w-full max-w-[1440px] overflow-hidden">
        <div className="absolute inset-x-0 top-[-20%] h-[125%]">
          {/* Flame background — decorative; lazy to keep LCP on logo + product. */}
          <div className="pointer-events-none absolute inset-[13.4%_-34.36%_2.18%_-37.43%] z-0">
            <Image
              src="/assets/home/hero-flame.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {/* Grill.am wordmark — LCP candidate */}
          <div className="pointer-events-none absolute inset-[26.53%_18.58%_50.76%_18.54%] z-[1]">
            <Image
              src="/assets/home/hero-logo.webp"
              alt="Grill.am"
              fill
              priority
              sizes="(max-width: 1440px) 63vw, 906px"
              className="object-contain"
            />
          </div>

          {/* Flame icon above “a” */}
          <div className="pointer-events-none absolute inset-[19.68%_21.46%_62.07%_65.56%] z-[1]">
            <Image
              src="/assets/home/hero-accent.webp"
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

          {/* CTA — top 644 / 1052 */}
          <div className="absolute top-[61.22%] left-1/2 z-10 -translate-x-1/2">
            <HeroMenuButton href={ctaHref} label={ctaLabel} />
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
  );
}
