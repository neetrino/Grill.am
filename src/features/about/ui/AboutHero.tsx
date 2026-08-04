import Image from "next/image";
import { Flame, Star } from "lucide-react";

import { ABOUT_HERO_IMAGE } from "@/features/about/content/team-members";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutHeroProps = {
  copy: Dictionary["about"];
};

function AboutFlameIcon({ className }: { className?: string }) {
  return (
    <Flame
      className={className}
      fill="currentColor"
      strokeWidth={1.5}
      aria-hidden
    />
  );
}

function AboutSinceBadge({ label, year }: { label: string; year: string }) {
  return (
    <div className="absolute bottom-4 left-4 z-20 flex size-[108px] flex-col items-center justify-center rounded-full border-[3px] border-white bg-brand-red text-white sm:bottom-5 sm:left-5 sm:size-[124px]">
      <AboutFlameIcon className="mb-0.5 size-4 text-brand-yellow sm:size-5" />
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase opacity-90 sm:text-[11px]">
        {label}
      </span>
      <span className="text-[28px] leading-none font-black tracking-tight sm:text-[32px]">
        {year}
      </span>
      <span className="mt-1.5 flex items-center gap-0.5" aria-hidden>
        <Star
          className="size-2.5 fill-brand-yellow text-brand-yellow sm:size-3"
          strokeWidth={0}
        />
        <Star
          className="mt-0.5 size-3.5 fill-brand-yellow text-brand-yellow sm:size-4"
          strokeWidth={0}
        />
        <Star
          className="size-2.5 fill-brand-yellow text-brand-yellow sm:size-3"
          strokeWidth={0}
        />
      </span>
    </div>
  );
}

export function AboutHero({ copy }: AboutHeroProps) {
  return (
    <section className="bg-white py-10 sm:py-12 md:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mb-8 flex flex-col items-start gap-3 sm:mb-10">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-cream px-4 py-2 text-xs font-bold tracking-[0.14em] text-[#5c3d1e] uppercase sm:text-[13px]">
            <AboutFlameIcon className="size-3.5 text-[#e85a1c]" />
            {copy.eyebrow}
          </span>

          <h1 className="whitespace-nowrap text-[22px] leading-[1.2] font-black tracking-tight text-brand-ink sm:text-[32px] lg:text-[40px]">
            <span>{copy.titleLead} </span>
            <span className="text-brand-red">{copy.titleAccent}</span>
          </h1>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10 xl:gap-12">
          <div className="relative w-full shrink-0 pt-[66%] lg:w-1/2 lg:pt-0">
            <div className="absolute inset-0 overflow-hidden rounded-[24px] sm:rounded-[28px]">
              <Image
                src={ABOUT_HERO_IMAGE}
                alt={copy.heroImageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
                priority
              />
              <AboutSinceBadge label={copy.badgeLabel} year={copy.badgeYear} />
            </div>
          </div>

          <div className="w-full space-y-4 text-base leading-7 text-[#2a2a2a] sm:text-[17px] sm:leading-8 lg:w-1/2">
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
