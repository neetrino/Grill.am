"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type FeatureItem = {
  title: string;
  description: string;
  imageSrc: string;
  tone: "red" | "white" | "cream" | "yellow";
};

type HomeFeaturesProps = {
  titleLead: string;
  titleAccent: string;
  items: readonly FeatureItem[];
};

const TONE_CLASSES: Record<FeatureItem["tone"], string> = {
  red: "bg-brand-red text-white",
  white: "bg-white text-brand-red ring-1 ring-black/5",
  cream: "bg-brand-cream text-brand-ink",
  yellow: "bg-brand-yellow text-brand-ink",
};

const DESCRIPTION_CLASSES: Record<FeatureItem["tone"], string> = {
  red: "text-white/89",
  white: "text-[rgba(245,37,22,0.57)]",
  cream: "text-[#7a5a2a]",
  yellow: "text-[#7a5a2a]",
};

function FeatureCard({
  item,
  index,
  revealed,
}: {
  item: FeatureItem;
  index: number;
  revealed: boolean;
}) {
  const titleLines = item.title.split(/\s+/);
  const stackedTitle =
    titleLines.length === 2 ? `${titleLines[0]}\n${titleLines[1]}` : item.title;

  return (
    <article
      className={`relative h-[220px] w-[240px] shrink-0 overflow-hidden rounded-3xl transition-all duration-700 ease-out sm:h-[257px] sm:w-[280px] lg:w-[300px] xl:w-[322px] ${TONE_CLASSES[item.tone]} ${
        revealed
          ? "translate-x-0 opacity-100"
          : "translate-x-16 opacity-0"
      }`}
      style={{ transitionDelay: revealed ? `${120 + index * 90}ms` : "0ms" }}
    >
      <div className="absolute top-5 -left-6 h-[180px] w-[160px] sm:h-[200px] sm:w-[175px]">
        <Image
          src={item.imageSrc}
          alt=""
          fill
          sizes="175px"
          className="object-contain"
        />
      </div>
      <div className="relative z-10 ml-[40%] flex h-full flex-col justify-center py-8 pr-4 pl-1 sm:ml-[42%] sm:py-10 sm:pr-5 sm:pl-2">
        <h3 className="text-[20px] leading-[26px] font-black whitespace-pre-line sm:text-[24px] sm:leading-[30px]">
          {stackedTitle}
        </h3>
        <p
          className={`mt-2 text-xs leading-[20px] sm:mt-3 sm:text-sm sm:leading-[22.75px] ${DESCRIPTION_CLASSES[item.tone]}`}
        >
          {item.description}
        </p>
      </div>
    </article>
  );
}

/** How much of the scooter stays visible in the intro (px from its right edge). */
const INTRO_MOTO_PEEK_PX = 150;

export function HomeFeatures({
  titleLead,
  titleAccent,
  items,
}: HomeFeaturesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const motoRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [introTranslateX, setIntroTranslateX] = useState(0);
  const [revealedTranslateX, setRevealedTranslateX] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);

    function onChange(): void {
      setReduceMotion(media.matches);
    }

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    function measureTrackPositions(): void {
      const stage = stageRef.current;
      const cards = cardsRef.current;
      const moto = motoRef.current;
      const track = cards?.parentElement;
      if (!stage || !cards || !moto || !track) return;

      const trackStyles = window.getComputedStyle(track);
      const gap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
      const paddingLeft = Number.parseFloat(trackStyles.paddingLeft) || 0;
      const stageWidth = stage.clientWidth;
      const cardsWidth = cards.offsetWidth;
      const motoWidth = moto.offsetWidth;
      const peek = Math.min(INTRO_MOTO_PEEK_PX, Math.round(motoWidth * 0.55));

      // Intro: cards off-screen left; title + slice of moto in view.
      setIntroTranslateX(
        -(cardsWidth + gap + Math.max(motoWidth - peek, 0)),
      );

      // Settled: equal side insets around the cards; moto stays off-screen right.
      const equalInsetX = (stageWidth - cardsWidth) / 2 - paddingLeft;
      setRevealedTranslateX(equalInsetX);
    }

    measureTrackPositions();
    window.addEventListener("resize", measureTrackPositions);
    return () => window.removeEventListener("resize", measureTrackPositions);
  }, [items.length]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    if (reduceMotion) {
      setRevealed(true);
      return;
    }

    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started) return;
        started = true;
        observer.disconnect();
        window.setTimeout(() => setRevealed(true), 150);
      },
      { threshold: 0.28, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const translateX =
    revealed || reduceMotion ? revealedTranslateX : introTranslateX;

  return (
    <section
      ref={sectionRef}
      className="w-full overflow-hidden py-14 sm:py-16 lg:py-20"
    >
      <div
        ref={stageRef}
        className="relative mx-auto h-[300px] w-full max-w-[1440px] sm:h-[360px] lg:h-[421px]"
      >
        <div
          className={`home-why-track absolute inset-y-0 left-0 flex h-full items-center gap-4 px-4 sm:gap-5 sm:px-6 lg:gap-6 lg:px-8 ${
            revealed ? "is-revealed" : "is-intro"
          }`}
          style={{
            transform: `translate3d(${translateX}px, 0, 0)`,
          }}
        >
          <div
            ref={cardsRef}
            className="flex shrink-0 items-center gap-3 sm:gap-4 lg:gap-[18px]"
          >
            {items.map((item, index) => (
              <FeatureCard
                key={item.title}
                item={item}
                index={index}
                revealed={revealed}
              />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
            <div
              ref={motoRef}
              className="relative h-[200px] w-[150px] shrink-0 sm:h-[280px] sm:w-[210px] lg:h-[360px] lg:w-[280px]"
            >
              <Image
                src="/assets/home/feature-scooter.webp"
                alt=""
                fill
                sizes="280px"
                className="object-contain object-left"
                priority={false}
              />
            </div>

            <h2 className="shrink-0 text-left text-[42px] leading-[0.9] font-black tracking-tight text-[#222] uppercase sm:text-[72px] lg:text-[120px] xl:text-[160px] xl:leading-[0.88]">
              <span className="block whitespace-nowrap">{titleLead}</span>
              <span className="block whitespace-nowrap text-brand-red-hot">
                {titleAccent}
              </span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
