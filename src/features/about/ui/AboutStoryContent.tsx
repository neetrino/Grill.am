"use client";

import {
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

const EASE = [0.16, 1, 0.3, 1] as const;
const GRILL_FOUNDED_YEAR = 2013;

type AboutStoryContentProps = {
  copy: Dictionary["about"]["story"];
};

function formatStoryStep(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function AboutStoryCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.65 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const controls = animate(0, target, {
      duration: 1.65,
      ease: EASE,
      onUpdate: (latest) => {
        setValue(Math.round(latest));
      },
    });

    return () => {
      controls.stop();
    };
  }, [isInView, target]);

  return <span ref={ref}>{value}</span>;
}

export function AboutStoryContent({ copy }: AboutStoryContentProps) {
  const reduceMotion = useReducedMotion();
  const yearsInBusiness = new Date().getFullYear() - GRILL_FOUNDED_YEAR;

  const leftItem = {
    hidden: { opacity: 0, x: -44, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.85, ease: EASE },
    },
  } as const;

  const lineItem = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: { duration: 0.95, ease: EASE },
    },
  } as const;

  const rightItem = {
    hidden: { opacity: 0, x: 48, y: 10 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.78,
        ease: EASE,
        staggerChildren: 0.07,
      },
    },
  } as const;

  const badgeItem = {
    hidden: { opacity: 0, scale: 0.55 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: EASE },
    },
  } as const;

  const textItem = {
    hidden: { opacity: 0, x: 18 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.62, ease: EASE },
    },
  } as const;

  if (reduceMotion) {
    return (
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.44fr)_1px_minmax(0,0.56fr)] lg:items-start lg:gap-14 xl:gap-16">
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.28em] text-brand-red uppercase">
            {copy.eyebrow}
          </p>
          <div className="relative mt-5 sm:mt-6">
            <p
              className="pointer-events-none absolute -bottom-2 left-0 max-w-full truncate font-black text-[clamp(3.25rem,11vw,6rem)] leading-none text-brand-ink/[0.05] uppercase select-none"
              aria-hidden
            >
              {copy.watermark}
            </p>
            <h2 className="relative max-w-md text-[clamp(1.65rem,3.4vw,2.4rem)] font-black leading-[1.08] tracking-tight text-brand-ink uppercase">
              {copy.title}
            </h2>
          </div>
          <div className="relative mt-12 flex items-end gap-3 sm:mt-14">
            <span className="text-[clamp(3.75rem,9vw,5.25rem)] font-black leading-none text-brand-red">
              {yearsInBusiness}
            </span>
            <span className="pb-1.5 text-sm font-bold tracking-[0.16em] text-brand-ink uppercase sm:pb-2">
              {copy.yearsLabel}
            </span>
          </div>
          <div
            className="mt-8 h-[3px] w-32 rounded-full bg-gradient-to-r from-brand-red via-brand-red/85 to-brand-ink/75 sm:mt-10 sm:w-36"
            aria-hidden
          />
        </div>

        <div
          className="hidden bg-brand-red/20 lg:block lg:min-h-full lg:w-px lg:justify-self-center"
          aria-hidden
        />
        <div className="h-px bg-brand-red/20 lg:hidden" aria-hidden />

        <div className="space-y-8 sm:space-y-9 lg:pt-1">
          {copy.paragraphs.map((paragraph, index) => (
            <div key={index} className="flex gap-4 sm:gap-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white sm:size-11 sm:text-sm">
                {formatStoryStep(index)}
              </span>
              <p className="pt-1.5 text-sm leading-relaxed text-brand-ink/80 sm:pt-2 sm:text-[15px] sm:leading-7">
                {paragraph}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.44fr)_1px_minmax(0,0.56fr)] lg:items-start lg:gap-14 xl:gap-16">
      <motion.div
        className="relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.32, margin: "0px 0px -56px 0px" }}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.14, delayChildren: 0.04 },
          },
        }}
      >
        <motion.p
          className="text-xs font-bold tracking-[0.28em] text-brand-red uppercase"
          variants={leftItem}
        >
          {copy.eyebrow}
        </motion.p>

        <motion.div className="relative mt-5 sm:mt-6" variants={leftItem}>
          <motion.p
            className="pointer-events-none absolute -bottom-2 left-0 max-w-full truncate font-black text-[clamp(3.25rem,11vw,6rem)] leading-none text-brand-ink/[0.05] uppercase select-none"
            aria-hidden
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 1.15, delay: 0.12, ease: EASE }}
          >
            {copy.watermark}
          </motion.p>
          <h2 className="relative max-w-md text-[clamp(1.65rem,3.4vw,2.4rem)] font-black leading-[1.08] tracking-tight text-brand-ink uppercase">
            {copy.title}
          </h2>
        </motion.div>

        <motion.div
          className="relative mt-12 flex items-end gap-3 sm:mt-14"
          variants={leftItem}
        >
          <span className="text-[clamp(3.75rem,9vw,5.25rem)] font-black leading-none text-brand-red">
            <AboutStoryCounter target={yearsInBusiness} />
          </span>
          <span className="pb-1.5 text-sm font-bold tracking-[0.16em] text-brand-ink uppercase sm:pb-2">
            {copy.yearsLabel}
          </span>
        </motion.div>

        <motion.div
          className="mt-8 h-[3px] w-32 origin-left rounded-full bg-gradient-to-r from-brand-red via-brand-red/85 to-brand-ink/75 sm:mt-10 sm:w-36"
          aria-hidden
          variants={lineItem}
        />
      </motion.div>

      <motion.div
        className="hidden origin-top bg-brand-red/20 lg:block lg:min-h-full lg:w-px lg:justify-self-center"
        aria-hidden
        initial={{ scaleY: 0, opacity: 0 }}
        whileInView={{ scaleY: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.25, margin: "0px 0px -40px 0px" }}
        transition={{ duration: 1.05, delay: 0.18, ease: EASE }}
      />

      <motion.div
        className="h-px origin-left bg-brand-red/20 lg:hidden"
        aria-hidden
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.85, ease: EASE }}
      />

      <motion.div
        className="space-y-8 sm:space-y-9 lg:pt-1"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2, margin: "0px 0px -48px 0px" }}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.16, delayChildren: 0.22 },
          },
        }}
      >
        {copy.paragraphs.map((paragraph, index) => (
          <motion.div key={index} className="flex gap-4 sm:gap-5" variants={rightItem}>
            <motion.span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white sm:size-11 sm:text-sm"
              variants={badgeItem}
            >
              {formatStoryStep(index)}
            </motion.span>
            <motion.p
              className="pt-1.5 text-sm leading-relaxed text-brand-ink/80 sm:pt-2 sm:text-[15px] sm:leading-7"
              variants={textItem}
            >
              {paragraph}
            </motion.p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
