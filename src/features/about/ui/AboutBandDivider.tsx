/** Decorative ember rule between about bands — sits in the white gutter. */
export function AboutBandDivider() {
  return (
    <div
      data-about-divider
      className="flex items-center justify-center gap-3 px-6 py-0.5 sm:gap-4 sm:px-10"
      aria-hidden
    >
      <span
        data-about-divider-bar
        className="h-px w-full max-w-[120px] origin-right bg-gradient-to-r from-transparent via-brand-red/20 to-brand-red/35 sm:max-w-[180px]"
      />
      <span
        data-about-divider-ember
        className="relative flex size-3 items-center justify-center"
      >
        <span className="absolute size-3 rounded-full bg-brand-yellow/35 blur-[2px]" />
        <span className="relative size-1.5 rounded-full bg-brand-yellow" />
      </span>
      <span
        data-about-divider-bar
        className="h-px w-full max-w-[120px] origin-left bg-gradient-to-l from-transparent via-brand-red/20 to-brand-red/35 sm:max-w-[180px]"
      />
    </div>
  );
}
