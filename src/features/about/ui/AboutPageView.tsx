import { AboutBandDivider } from "@/features/about/ui/AboutBandDivider";
import { AboutHero } from "@/features/about/ui/AboutHero";
import { AboutMotionShell } from "@/features/about/ui/AboutMotionShell";
import { AboutStory } from "@/features/about/ui/AboutStory";
import { AboutTimeline } from "@/features/about/ui/AboutTimeline";
import { AboutValues } from "@/features/about/ui/AboutValues";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutPageViewProps = {
  copy: Dictionary["about"];
  locale: Locale;
};

/**
 * Near full-bleed stack on white: generous rhythm + ember dividers
 * between rounded bands so separations read as deliberate composition.
 * Motion + Lenis + GSAP live inside AboutMotionShell.
 */
export function AboutPageView({ copy, locale }: AboutPageViewProps) {
  return (
    <AboutMotionShell>
      <div className="storefront-bleed -my-10 min-h-full bg-white px-2 py-3 sm:px-3 sm:py-4 lg:px-4 lg:py-5">
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
          <AboutHero copy={copy.hero} locale={locale} />
          <AboutBandDivider />
          <AboutStory copy={copy.story} />
          <AboutBandDivider />
          <AboutTimeline copy={copy.timeline} />
          <AboutBandDivider />
          <AboutValues copy={copy.values} />
        </div>
      </div>
    </AboutMotionShell>
  );
}
