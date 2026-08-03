"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type FeatureTone = "red" | "white" | "cream" | "yellow";

type FeatureItem = {
  title: string;
  description: string;
  imageSrc: string;
  tone: FeatureTone;
};

type HomeFeaturesProps = {
  titleLead: string;
  titleAccent: string;
  items: readonly FeatureItem[];
};

/** Figma card shells — nodes 187:254 / 258 / 263 / 267 (322×257, r24). */
const CARD_SHELL: Record<FeatureTone, string> = {
  red: "bg-brand-red",
  white: "bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)]",
  cream: "bg-brand-cream",
  yellow: "bg-brand-yellow",
};

const CARD_TITLE: Record<FeatureTone, string> = {
  red: "left-[140px] top-[45px] w-[159px] text-[25px] leading-[30px] text-white",
  white: "left-[161px] top-[43px] w-[136px] text-[25px] leading-[30px] text-brand-red",
  cream: "left-[140px] top-[46px] w-[159px] text-[25px] leading-[30px] text-brand-ink",
  yellow: "left-[161px] top-[39px] text-[24px] leading-[30px] text-brand-ink",
};

const CARD_DESCRIPTION: Record<FeatureTone, string> = {
  red: "left-[139px] top-[112px] w-[170px] text-[16px] leading-[22.75px] text-white/89",
  white:
    "left-[161px] top-[115px] w-[139px] text-[14px] leading-[22.75px] text-[rgba(245,37,22,0.78)]",
  cream: "left-[142px] top-[113px] w-[168px] text-[14px] leading-[22.75px] text-[#7a5a2a]",
  yellow:
    "left-[150px] top-[103px] w-[160px] whitespace-pre-line text-[14px] leading-[22.75px] text-[#7a5a2a]",
};

const CARD_IMAGE: Record<FeatureTone, string> = {
  red: "left-[-125px] top-[-93px] z-[1] h-[448px] w-[352px] rotate-[1.86deg]",
  white: "left-[-24px] top-[27px] z-[1] h-[198px] w-[185px]",
  cream: "left-[-65px] top-[-32px] z-[1] h-[320px] w-[250px]",
  yellow: "left-[-46px] top-[20px] z-[1] size-[218px]",
};

/** Figma vertical offsets — cards sit at different heights. */
const CARD_OFFSET_Y: Record<FeatureTone, number> = {
  red: 0,
  white: -66,
  cream: 0,
  yellow: -60,
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
  const titleLines = item.title.trim().split(/\s+/);
  const stackedTitle =
    titleLines.length === 2 ? `${titleLines[0]}\n${titleLines[1]}` : item.title;
  const offsetY = CARD_OFFSET_Y[item.tone];
  const offsetX = revealed ? 0 : 64;

  return (
    <article
      className={`relative h-[257px] w-[322px] shrink-0 overflow-visible rounded-[24px] transition-all duration-700 ease-out ${CARD_SHELL[item.tone]} ${
        revealed ? "opacity-100" : "opacity-0"
      }`}
      style={{
        transitionDelay: revealed ? `${120 + index * 90}ms` : "0ms",
        transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
      }}
    >
      <div className={`pointer-events-none absolute ${CARD_IMAGE[item.tone]}`}>
        <Image
          src={item.imageSrc}
          alt=""
          fill
          sizes="220px"
          className="object-contain drop-shadow-md"
        />
      </div>
      <h3
        className={`absolute z-10 font-black break-words whitespace-pre-line [text-shadow:0.3px_0_0_currentColor,-0.3px_0_0_currentColor,0_0.3px_0_currentColor,0_-0.3px_0_currentColor] ${CARD_TITLE[item.tone]}`}
      >
        {stackedTitle}
      </h3>
      <p
        className={`absolute z-10 break-words ${CARD_DESCRIPTION[item.tone]}`}
      >
        {item.description}
      </p>
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
    let revealTimer: number | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started) return;
        started = true;
        observer.disconnect();
        revealTimer = window.setTimeout(() => setRevealed(true), 750);
      },
      { threshold: 0.28, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (revealTimer != null) {
        window.clearTimeout(revealTimer);
      }
    };
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
          className={`home-why-track absolute inset-y-0 left-0 flex h-full items-center gap-4 px-4 sm:gap-5 sm:px-6 lg:gap-[31px] lg:px-8 ${
            revealed ? "is-revealed" : "is-intro"
          }`}
          style={{
            transform: `translate3d(${translateX}px, 0, 0)`,
          }}
        >
          <div
            ref={cardsRef}
            className="flex shrink-0 items-center gap-[18px] overflow-visible sm:gap-6 lg:gap-[31px]"
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
