import { ABOUT_SECTION_SURFACE } from "@/features/about/ui/about-section-surface";
import {
  AboutReveal,
  AboutStagger,
  AboutStaggerItem,
} from "@/features/about/ui/AboutReveal";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutTimelineProps = {
  copy: Dictionary["about"]["timeline"];
};

export function AboutTimeline({ copy }: AboutTimelineProps) {
  return (
    <section
      data-about-band
      className={`bg-[#1a0f10] py-16 sm:py-20 lg:py-24 ${ABOUT_SECTION_SURFACE}`}
    >
      <div className="page-container">
        <AboutReveal>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight tracking-tight text-white uppercase">
            {copy.title}
          </h2>
        </AboutReveal>

        <AboutStagger className="relative mt-12 space-y-4 lg:mt-14" stagger={0.16}>
          <div
            data-about-timeline-line
            className="absolute top-6 bottom-6 left-[27px] w-px origin-top rounded-full bg-gradient-to-b from-brand-yellow via-brand-red to-transparent sm:left-[31px]"
            aria-hidden
          />
          {copy.items.map((item, index) => (
            <AboutStaggerItem
              key={`${item.year}-${item.title}`}
              from={index % 2 === 0 ? "left" : "right"}
              className="relative grid gap-3 rounded-[24px] bg-white/[0.04] py-6 pr-5 pl-14 sm:grid-cols-[7rem_1fr] sm:gap-8 sm:rounded-[28px] sm:py-7 sm:pr-7 sm:pl-16"
            >
              <span
                className="absolute top-7 left-4 flex size-7 items-center justify-center rounded-full border-2 border-brand-yellow bg-[#1a0f10] sm:top-8 sm:left-5 sm:size-8"
                aria-hidden
              >
                <span className="size-2.5 rounded-full bg-brand-red" />
              </span>
              <p className="text-2xl leading-none font-black tracking-tight text-brand-yellow sm:text-3xl">
                {item.year}
              </p>
              <div>
                <h3 className="text-lg font-bold text-white sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                  {item.body}
                </p>
              </div>
            </AboutStaggerItem>
          ))}
        </AboutStagger>
      </div>
    </section>
  );
}
