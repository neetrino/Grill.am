"use client";

import { Flame, Leaf } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AppLink } from "@/components/ui/AppLink";
import type { StorefrontHeroSlide } from "@/features/hero/application/queries";
import { HeroArtImage } from "@/features/home/ui/HeroArtImage";
import { HeroChickenPlate } from "@/features/home/ui/HeroChickenPlate";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

type HomeHeroProps = {
  slides: StorefrontHeroSlide[];
  fallbackTitle: string;
  fallbackSubtitle: string;
  tasteLabel: string;
  freshLabel: string;
  chickenGrabLabel: string;
  fallbackCtaLabel: string;
  fallbackCtaHref: string;
};

const HERO_CHICKEN = staticAssetUrl("/assets/home/hero-chicken.webp");
const HERO_FLAME = staticAssetUrl("/assets/home/hero-flame.webp");
const HERO_LOGO = staticAssetUrl("/assets/home/hero-logo.webp");

const MENU_BUTTON_CLASS =
  "inline-flex h-11 w-[162px] items-center justify-center rounded-full bg-white text-center text-[13px] leading-[19.5px] font-extrabold tracking-[0.32px] text-brand-red uppercase transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:h-14 md:w-[193px] md:text-base md:leading-[22.5px] md:tracking-wide md:hover:shadow-lg";

function HeroMenuButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  if (href.startsWith("/")) {
    return (
      <AppLink href={href} prefetchPolicy="intent" className={MENU_BUTTON_CLASS}>
        {label}
      </AppLink>
    );
  }

  return (
    <a href={href} className={MENU_BUTTON_CLASS}>
      {label}
    </a>
  );
}

function HeroHighlight({
  label,
  icon,
}: {
  label: string;
  icon: ReactNode;
}) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full bg-white/12 px-2.5 py-1.5 text-[12px] leading-none font-bold tracking-wide text-white uppercase backdrop-blur-[2px] md:gap-2.5 md:px-3 md:py-2 md:text-[13px]">
      <span className="flex size-7 items-center justify-center rounded-full bg-brand-yellow text-brand-red md:size-8">
        {icon}
      </span>
      {label}
    </li>
  );
}

function HeroHighlights({
  tasteLabel,
  freshLabel,
}: {
  tasteLabel: string;
  freshLabel: string;
}) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2 md:mt-6 md:gap-3">
      <HeroHighlight
        label={tasteLabel}
        icon={<Flame className="size-3.5 md:size-4" strokeWidth={2.4} aria-hidden />}
      />
      <HeroHighlight
        label={freshLabel}
        icon={<Leaf className="size-3.5 md:size-4" strokeWidth={2.4} aria-hidden />}
      />
    </ul>
  );
}

function HeroCopy({
  title,
  subtitle,
  tasteLabel,
  freshLabel,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  tasteLabel: string;
  freshLabel: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="relative z-10 flex w-[58%] flex-col items-start px-5 pt-6 pb-5 md:w-[48%] md:px-12 md:py-10 lg:px-16">
      <div className="relative h-[88px] w-full max-w-[220px] md:h-[140px] md:max-w-[420px] lg:h-[168px] lg:max-w-[520px]">
        <HeroArtImage
          src={HERO_LOGO}
          alt={title}
          fill
          priority
          sizes="(max-width: 768px) 220px, 520px"
          className="object-contain object-left"
        />
      </div>
      <p className="mt-2 text-[13px] leading-[19.5px] text-white/75 md:mt-3 md:text-lg md:leading-7">
        {subtitle}
      </p>
      <HeroHighlights tasteLabel={tasteLabel} freshLabel={freshLabel} />
      <div className="mt-6 md:mt-8">
        <HeroMenuButton href={ctaHref} label={ctaLabel} />
      </div>
    </div>
  );
}

function HeroSlideDots({
  slides,
  index,
  onSelect,
}: {
  slides: StorefrontHeroSlide[];
  index: number;
  onSelect: (slideIndex: number) => void;
}) {
  if (slides.length <= 1) {
    return null;
  }

  return (
    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-5">
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
          onClick={() => onSelect(slideIndex)}
        />
      ))}
    </div>
  );
}

function useRotatingIndex(length: number): [number, (next: number) => void] {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [length]);

  return [index, setIndex];
}

export function HomeHero({
  slides,
  fallbackTitle,
  fallbackSubtitle,
  tasteLabel,
  freshLabel,
  chickenGrabLabel,
  fallbackCtaLabel,
  fallbackCtaHref,
}: HomeHeroProps) {
  const [index, setIndex] = useRotatingIndex(slides.length);
  const active = slides[index] ?? null;
  const ctaHref = active?.copy.buttonUrl ?? fallbackCtaHref;
  const photoSrc =
    active?.desktopImageUrl ?? active?.mobileImageUrl ?? HERO_CHICKEN;

  return (
    <section className="relative px-4 pt-2 pb-8 md:px-0 md:pb-10">
      <div className="relative overflow-hidden rounded-[24px] bg-brand-red md:rounded-none">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <HeroArtImage
            src={HERO_FLAME}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="relative mx-auto flex min-h-[300px] w-full max-w-[1440px] items-center md:h-[min(46vw,680px)] md:min-h-[540px]">
          <HeroCopy
            title={fallbackTitle}
            subtitle={fallbackSubtitle}
            tasteLabel={tasteLabel}
            freshLabel={freshLabel}
            ctaHref={ctaHref}
            ctaLabel={fallbackCtaLabel}
          />
          <HeroSlideDots slides={slides} index={index} onSelect={setIndex} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-4 top-2 bottom-0 mx-auto max-w-[1440px] overflow-visible md:inset-x-0 md:top-0">
        <HeroChickenPlate src={photoSrc} grabLabel={chickenGrabLabel} />
      </div>
    </section>
  );
}
