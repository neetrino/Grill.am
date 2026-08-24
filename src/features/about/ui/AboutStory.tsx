import { ABOUT_SECTION_SURFACE } from "@/features/about/ui/about-section-surface";
import { AboutStoryContent } from "@/features/about/ui/AboutStoryContent";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutStoryProps = {
  copy: Dictionary["about"]["story"];
};

export function AboutStory({ copy }: AboutStoryProps) {
  return (
    <section
      data-about-band
      className={`relative bg-white py-16 sm:py-20 lg:py-24 ${ABOUT_SECTION_SURFACE}`}
    >
      <div className="page-container">
        <AboutStoryContent copy={copy} />
      </div>
    </section>
  );
}
