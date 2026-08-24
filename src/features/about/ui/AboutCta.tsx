import { AppLink } from "@/components/ui/AppLink";
import { ABOUT_SECTION_SURFACE } from "@/features/about/ui/about-section-surface";
import { AboutReveal } from "@/features/about/ui/AboutReveal";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutCtaProps = {
  copy: Dictionary["about"]["cta"];
  locale: Locale;
};

export function AboutCta({ copy, locale }: AboutCtaProps) {
  const menuHref = `/${locale}/products`;
  const storesHref = `/${locale}/stores`;

  return (
    <section
      data-about-band
      className={`bg-brand-red py-16 sm:py-20 lg:py-24 ${ABOUT_SECTION_SURFACE}`}
    >
      <div className="page-container">
        <AboutReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight tracking-tight text-white uppercase">
            {copy.title}
          </h2>
          <p className="mt-4 text-base text-white/85 sm:text-lg">{copy.lead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <AppLink
              href={menuHref}
              prefetchPolicy="intent"
              className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-full bg-brand-yellow px-7 text-sm font-bold text-brand-ink transition hover:bg-brand-yellow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {copy.menuLabel}
            </AppLink>
            <AppLink
              href={storesHref}
              prefetchPolicy="intent"
              className="inline-flex h-12 min-w-[150px] items-center justify-center rounded-full border-2 border-white/80 bg-transparent px-7 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {copy.storesLabel}
            </AppLink>
          </div>
        </AboutReveal>
      </div>
    </section>
  );
}
