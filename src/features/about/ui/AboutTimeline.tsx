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
      className={`bg-brand-ink py-16 sm:py-20 lg:py-24 ${ABOUT_SECTION_SURFACE}`}
    >
      <div className="page-container">
        <AboutReveal>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight tracking-tight text-white uppercase">
            {copy.title}
          </h2>
          <div
            className="mt-5 h-1 w-14 rounded-full bg-brand-yellow"
            aria-hidden
          />
        </AboutReveal>

        <AboutStagger
          className="relative mt-12 space-y-5 lg:mt-14 lg:space-y-6"
          stagger={0.14}
        >
          <div
            data-about-timeline-line
            className="absolute top-8 bottom-8 left-[31px] w-[2px] origin-top rounded-full bg-brand-yellow/30 sm:left-[35px]"
            aria-hidden
          />

          {copy.items.map((item, index) => (
            <AboutStaggerItem
              key={`${item.year}-${item.title}-${index}`}
              from={index % 2 === 0 ? "left" : "right"}
              className="group relative rounded-[24px] border border-white/[0.08] bg-white/[0.03] py-6 pr-5 pl-[4.25rem] transition duration-300 hover:border-brand-yellow/25 hover:bg-white/[0.05] sm:rounded-[28px] sm:py-7 sm:pl-[4.75rem] sm:pr-7"
            >
              <span
                className="absolute top-7 left-4 flex size-8 items-center justify-center rounded-full border-[3px] border-brand-yellow bg-brand-ink sm:top-8 sm:left-5 sm:size-9"
                aria-hidden
              >
                <span className="size-2.5 rounded-full bg-brand-red" />
              </span>

              <div className="grid gap-4 sm:grid-cols-[minmax(5.5rem,7.5rem)_1fr] sm:items-start sm:gap-8">
                <p className="text-[clamp(1.15rem,2.2vw,1.75rem)] leading-[1.1] font-black tracking-tight text-brand-yellow">
                  {item.year}
                </p>

                <div>
                  {item.title ? (
                    <h3 className="text-lg font-bold text-white sm:text-xl">
                      {item.title}
                    </h3>
                  ) : null}
                  <p
                    className={`max-w-2xl text-sm leading-relaxed text-white/75 sm:text-[15px] sm:leading-7 ${item.title ? "mt-2" : ""}`}
                  >
                    {item.body}
                  </p>
                </div>
              </div>
            </AboutStaggerItem>
          ))}
        </AboutStagger>
      </div>
    </section>
  );
}
