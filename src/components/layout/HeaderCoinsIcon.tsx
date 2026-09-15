type IconProps = {
  className?: string;
};

/** Local `public/` asset — not on R2 yet; do not wrap with `staticAssetUrl`. */
const COIN_SRC = "/assets/brand/coins-coin.webp";

/**
 * Gold flame coin art — header/product bonuses pills.
 */
export function HeaderCoinsIcon({ className }: IconProps) {
  return (
    // Static public asset; native img avoids next/image config for tiny chrome icons.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={COIN_SRC}
      alt=""
      width={32}
      height={32}
      decoding="async"
      className={`rounded-full object-cover ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}
