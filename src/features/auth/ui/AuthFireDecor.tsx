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
/** Drop the fire on coins login so flame tips sit below the floating coins. */
const COINS_FIRE_OFFSET = "7rem";

/** Inner 3D coin vector (Figma 372:484) inside the Phosphor icon box. */
const COIN_VECTOR_BOX = {
  top: "18.75%",
  left: "6.25%",
  width: "87.5%",
  height: "62.5%",
} as const;

const COIN_PLACEMENTS: readonly CoinPlacement[] = [
  {
    left: "2.47%",
    top: "30.54%",
    size: "16.2%",
    icon: "70.84%",
    rotate: "131.59deg",
  },
  {
    left: "4.86%",
    top: "6.03%",
    size: "15.59%",
    icon: "73.59%",
    rotate: "-151.07deg",
  },
  {
    left: "24.02%",
    top: "14.38%",
    size: "15.85%",
    icon: "72.34%",
    rotate: "-57.2deg",
  },
  {
    left: "66.09%",
    top: "10.45%",
    size: "15.88%",
    icon: "72.26%",
    rotate: "-56.89deg",
  },
  {
    left: "78.79%",
    top: "29.41%",
    size: "14.05%",
    icon: "81.65%",
    rotate: "-105deg",
  },
  {
    left: "83.98%",
    top: "10.02%",
    size: "11.86%",
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
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden
    >
      {/* Static public asset; native img keeps the SVG grain filter intact. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AUTH_FIRE_SRC}
        alt=""
        className="absolute bottom-0 left-0 h-auto w-full max-w-none"
        style={
          showCoins ? { transform: `translateY(${COINS_FIRE_OFFSET})` } : undefined
        }
      />
      {showCoins ? (
        <div
          className="absolute top-[calc(var(--storefront-header-offset,9.5rem)-2.5rem)] left-1/2 hidden w-full -translate-x-1/2 lg:block"
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
