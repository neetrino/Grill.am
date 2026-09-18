import {
  AUTH_COIN_SRC,
  AUTH_FIRE_SRC,
} from "@/features/auth/content/auth-assets";

type AuthFireDecorProps = {
  showCoins: boolean;
};

/**
 * Figma 371:308 — `left`/`top`/`size` are the unrotated AABB of a `ph:coin-fill`.
 * `icon` is the inner square so rotation fits that AABB (Figma hypot() slot).
 */
type CoinPlacement = {
  left: string;
  top: string;
  size: string;
  icon: string;
  rotate: string;
};

const FIGMA_STAGE_WIDTH_PX = 1470;
const FIGMA_STAGE_ASPECT = "1470 / 953";

/** Inner 3D coin vector (Figma 372:484) inside the Phosphor icon box. */
const COIN_VECTOR_BOX = {
  top: "18.75%",
  left: "6.25%",
  width: "87.5%",
  height: "62.5%",
} as const;

const COIN_PLACEMENTS: readonly CoinPlacement[] = [
  {
    left: "8.2%",
    top: "30.54%",
    size: "10%",
    icon: "70.84%",
    rotate: "131.59deg",
  },
  {
    left: "1.1%",
    top: "6.03%",
    size: "9.7%",
    icon: "73.59%",
    rotate: "-151.07deg",
  },
  {
    left: "17.4%",
    top: "14.38%",
    size: "9.8%",
    icon: "72.34%",
    rotate: "-57.2deg",
  },
  {
    left: "72.4%",
    top: "10.45%",
    size: "9.8%",
    icon: "72.26%",
    rotate: "-56.89deg",
  },
  {
    left: "84.2%",
    top: "20%",
    size: "8.6%",
    icon: "81.65%",
    rotate: "-105deg",
  },
  {
    left: "89.1%",
    top: "10.02%",
    size: "7.3%",
    icon: "96.67%",
    rotate: "177.99deg",
  },
];

function AuthStageCoin({ coin }: { coin: CoinPlacement }) {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: coin.left,
        top: coin.top,
        width: coin.size,
        aspectRatio: "1",
      }}
    >
      <div
        className="relative overflow-hidden opacity-60"
        style={{
          width: coin.icon,
          aspectRatio: "1",
          transform: `rotate(${coin.rotate})`,
        }}
      >
        {/* Static public asset; native img keeps the SVG grain filter intact. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AUTH_COIN_SRC}
          alt=""
          className="absolute max-w-none"
          style={COIN_VECTOR_BOX}
        />
      </div>
    </div>
  );
}

/**
 * Figma fire graphic, plus floating coins on the guest-coins login.
 */
export function AuthFireDecor({ showCoins }: AuthFireDecorProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Sit in the first viewport so flames stay visible above the footer. */}
      <div className="absolute inset-x-0 top-0 h-dvh">
        {/* Static public asset; native img keeps the SVG grain filter intact. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AUTH_FIRE_SRC}
          alt=""
          className="absolute bottom-0 left-0 h-auto w-full max-w-none -translate-y-8"
        />
      </div>
      {showCoins ? (
        <div
          className="absolute top-[calc(var(--storefront-header-offset,9.5rem)-4.5rem)] left-1/2 hidden w-full -translate-x-1/2 lg:block"
          style={{
            maxWidth: FIGMA_STAGE_WIDTH_PX,
            aspectRatio: FIGMA_STAGE_ASPECT,
          }}
        >
          {COIN_PLACEMENTS.map((coin) => (
            <AuthStageCoin key={`${coin.left}-${coin.top}`} coin={coin} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
