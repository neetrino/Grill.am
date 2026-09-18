import type { Dictionary } from "@/lib/i18n/get-dictionary";

type LoginCoinsInfoCardProps = {
  copy: Dictionary["auth"]["coinsGate"];
};

/**
 * Guest login aside — Grill Coins program explainer.
 */
export function LoginCoinsInfoCard({ copy }: LoginCoinsInfoCardProps) {
  return (
    <aside className="flex h-full flex-col justify-center rounded-[22px] bg-brand-ink px-7 py-8 shadow-[0_28px_90px_rgba(7,16,20,0.32)] sm:px-8 sm:py-10">
      <h2 className="font-sans text-[2rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-white uppercase sm:text-[2.35rem]">
        {copy.title}
      </h2>
      <p className="mt-5 text-lg font-semibold leading-snug text-brand-red sm:mt-6 sm:text-xl">
        {copy.subtitle}
      </p>
      <p className="mt-4 text-base leading-relaxed text-white/60 sm:mt-5">
        {copy.body}
      </p>
      <div className="mt-8">
        <span className="inline-flex items-center rounded-full bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-ink">
          {copy.ratePill}
        </span>
      </div>
    </aside>
  );
}
