"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { AppLink } from "@/components/ui/AppLink";
import { ABOUT_HERO_IMAGE } from "@/features/about/content/team-members";
import { ABOUT_SECTION_SURFACE } from "@/features/about/ui/about-section-surface";
import { AboutHeroMotion } from "@/features/about/ui/AboutReveal";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutHeroProps = {
  copy: Dictionary["about"]["hero"];
  locale: Locale;
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function AboutHero({ copy, locale }: AboutHeroProps) {
  const menuHref = `/${locale}/products`;
  const storesHref = `/${locale}/stores`;
  const reduceMotion = useReducedMotion();

  return (
    <section
      className={`relative isolate min-h-[min(92vh,820px)] overflow-hidden bg-brand-ink ${ABOUT_SECTION_SURFACE}`}
    >
      <motion.div
        data-about-hero-media
        className="absolute inset-0"
        initial={reduceMotion ? false : { scale: 1.18, opacity: 0.35 }}
        animate={{ scale: 1.08, opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      >
        <Image
          src={ABOUT_HERO_IMAGE}
          alt={copy.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-brand-ink/72 via-brand-ink/35 to-transparent"
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.15, ease: EASE }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-brand-ink/55 via-transparent to-brand-ink/20"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute -right-16 bottom-0 font-mirage text-[clamp(120px,28vw,320px)] leading-none text-white/[0.06] uppercase select-none"
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.4, delay: 0.35, ease: EASE }}
      >
        Grill
      </motion.div>

      <div className="page-container relative z-10 flex min-h-[min(92vh,820px)] flex-col justify-end pb-14 pt-28 sm:pb-16 sm:pt-32 lg:pb-20 lg:pt-36">
        <AboutHeroMotion>
          <p className="font-mirage text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.9] tracking-tight text-white">
            {copy.brand}
          </p>
        </AboutHeroMotion>

        <AboutHeroMotion delay={0.14} className="mt-5 max-w-xl sm:mt-6">
          <h1 className="text-[clamp(1.5rem,3.5vw,2.35rem)] font-black leading-tight tracking-tight text-white uppercase">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
            {copy.lead}
          </p>
        </AboutHeroMotion>

        <AboutHeroMotion
          delay={0.28}
          className="mt-8 flex flex-wrap gap-3 sm:mt-10"
        >
          <AppLink
            href={menuHref}
            prefetchPolicy="intent"
            className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-full bg-brand-red px-7 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
          >
            {copy.primaryCta}
          </AppLink>
          <AppLink
            href={storesHref}
            prefetchPolicy="intent"
            className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-full border border-white/35 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
          >
            {copy.secondaryCta}
          </AppLink>
        </AboutHeroMotion>
      </div>
    </section>
  );
}
