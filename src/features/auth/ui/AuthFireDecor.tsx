import {
  AUTH_COIN_SRC,
  AUTH_FIRE_SRC,
} from "@/features/auth/content/auth-assets";

type AuthFireDecorProps = {
  showCoins: boolean;
};

const COIN_PLACEMENTS = [
  "top-[10%] left-[5%] w-[18vw] max-w-[160px] -rotate-[28deg] lg:top-[12%] lg:left-[6%]",
  "top-[36%] left-[2%] w-[20vw] max-w-[170px] rotate-[18deg] lg:top-[40%] lg:left-[3%]",
  "top-[20%] left-[20%] w-[22vw] max-w-[180px] -rotate-[48deg] lg:left-[22%]",
  "top-[14%] right-[20%] w-[20vw] max-w-[170px] -rotate-[42deg] lg:right-[22%]",
  "top-[12%] right-[4%] w-[16vw] max-w-[140px] rotate-[12deg] lg:right-[6%]",
  "top-[38%] right-[6%] w-[18vw] max-w-[160px] -rotate-[75deg] lg:top-[42%] lg:right-[8%]",
] as const;

/**
 * Figma fire graphic, plus floating coins on the guest-coins login.
 */
export function AuthFireDecor({ showCoins }: AuthFireDecorProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden
    >
      {/* Static public asset; native img keeps the SVG grain filter intact. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AUTH_FIRE_SRC}
        alt=""
        className="absolute bottom-0 left-0 h-auto w-full max-w-none"
      />
      {showCoins
        ? COIN_PLACEMENTS.map((className) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={className}
              src={AUTH_COIN_SRC}
              alt=""
              className={`absolute hidden opacity-70 lg:block ${className}`}
            />
          ))
        : null}
    </div>
  );
}
