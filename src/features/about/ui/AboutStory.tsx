import { Beef, Heart, Sparkles, Timer, Truck, type LucideIcon } from "lucide-react";

import { ABOUT_SECTION_SURFACE } from "@/features/about/ui/about-section-surface";
import {
  AboutReveal,
  AboutStagger,
  AboutStaggerItem,
} from "@/features/about/ui/AboutReveal";
import { AboutStoryCard } from "@/features/about/ui/AboutStoryCard";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutStoryProps = {
  copy: Dictionary["about"]["story"];
};

const STORY_ICONS: LucideIcon[] = [Heart, Beef, Truck, Sparkles, Timer];

export function AboutStory({ copy }: AboutStoryProps) {
  return (
    <section
      data-about-band
      className={`relative bg-brand-red py-16 text-white sm:py-20 lg:py-24 ${ABOUT_SECTION_SURFACE}`}
    >
      <div className="page-container relative">
        <AboutReveal>
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-brand-ink uppercase shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
            <span
              className="size-1.5 shrink-0 rounded-full bg-brand-red"
              aria-hidden
            />
            {copy.eyebrow}
          </p>
          <h2 className="mt-4 max-w-2xl text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight tracking-tight text-white uppercase">
            {copy.title}
          </h2>
        </AboutReveal>

        <AboutStagger
          className="mt-10 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5"
          stagger={0.08}
        >
          {copy.cards.map((card, index) => {
            const icon = STORY_ICONS[index] ?? Heart;
            const from = index % 2 === 0 ? "left" : "right";
            return (
              <AboutStaggerItem
                key={card.title}
                className="h-full"
                from={from}
              >
                <AboutStoryCard
                  icon={icon}
                  title={card.title}
                  body={card.body}
                />
              </AboutStaggerItem>
            );
          })}
        </AboutStagger>
      </div>
    </section>
  );
}
