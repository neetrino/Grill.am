import type { CSSProperties } from "react";

import { AUTH_COIN_SRC } from "@/features/auth/content/auth-assets";
import styles from "@/features/auth/ui/AuthFireDecor.module.css";

type FallingCoin = {
  left: string;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  swayPx: number;
  spinStartDeg: number;
  spinEndDeg: number;
};

/** Scattered rain — staggered so the stage is already mid-fall on first paint. */
const FALLING_COINS: readonly FallingCoin[] = [
  {
    left: "3%",
    sizePx: 78,
    durationSec: 11.2,
    delaySec: -8.4,
    swayPx: 22,
    spinStartDeg: -28,
    spinEndDeg: 214,
  },
  {
    left: "11%",
    sizePx: 96,
    durationSec: 13.5,
    delaySec: -3.1,
    swayPx: -18,
    spinStartDeg: 48,
    spinEndDeg: 312,
  },
  {
    left: "19%",
    sizePx: 64,
    durationSec: 9.8,
    delaySec: -6.7,
    swayPx: 14,
    spinStartDeg: -132,
    spinEndDeg: 86,
  },
  {
    left: "28%",
    sizePx: 88,
    durationSec: 12.4,
    delaySec: -1.2,
    swayPx: -26,
    spinStartDeg: 16,
    spinEndDeg: 248,
  },
  {
    left: "37%",
    sizePx: 58,
    durationSec: 10.6,
    delaySec: -9.9,
    swayPx: 10,
    spinStartDeg: -64,
    spinEndDeg: 176,
  },
  {
    left: "48%",
    sizePx: 72,
    durationSec: 14.1,
    delaySec: -4.8,
    swayPx: -12,
    spinStartDeg: 108,
    spinEndDeg: 340,
  },
  {
    left: "58%",
    sizePx: 84,
    durationSec: 11.8,
    delaySec: -7.3,
    swayPx: 20,
    spinStartDeg: -96,
    spinEndDeg: 158,
  },
  {
    left: "67%",
    sizePx: 62,
    durationSec: 9.4,
    delaySec: -2.6,
    swayPx: -16,
    spinStartDeg: 72,
    spinEndDeg: 268,
  },
  {
    left: "74%",
    sizePx: 102,
    durationSec: 13.1,
    delaySec: -10.5,
    swayPx: 8,
    spinStartDeg: -44,
    spinEndDeg: 196,
  },
  {
    left: "82%",
    sizePx: 70,
    durationSec: 10.2,
    delaySec: -5.4,
    swayPx: -22,
    spinStartDeg: 134,
    spinEndDeg: 360,
  },
  {
    left: "89%",
    sizePx: 90,
    durationSec: 12.8,
    delaySec: -0.8,
    swayPx: 16,
    spinStartDeg: -18,
    spinEndDeg: 228,
  },
  {
    left: "94%",
    sizePx: 56,
    durationSec: 8.9,
    delaySec: -6.1,
    swayPx: -10,
    spinStartDeg: 88,
    spinEndDeg: 300,
  },
];

function fallingCoinStyle(coin: FallingCoin): CSSProperties {
  return {
    "--coin-left": coin.left,
    "--coin-size": `${coin.sizePx}px`,
    "--coin-duration": `${coin.durationSec}s`,
    "--coin-delay": `${coin.delaySec}s`,
    "--coin-sway": `${coin.swayPx}px`,
    "--coin-spin-start": `${coin.spinStartDeg}deg`,
    "--coin-spin-end": `${coin.spinEndDeg}deg`,
  } as CSSProperties;
}

/**
 * Looping coin rain over the auth fire. Frozen scatter when motion is reduced.
 */
export function AuthFallingCoins() {
  return (
    <>
      <div className={styles.fallingLayer}>
        {FALLING_COINS.map((coin) => (
          <div
            key={`${coin.left}-${coin.delaySec}`}
            className={styles.coin}
            style={fallingCoinStyle(coin)}
          >
            {/* Static public asset; native img keeps the SVG grain filter intact. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={AUTH_COIN_SRC} alt="" className={styles.art} />
          </div>
        ))}
      </div>
      <div className={styles.staticLayer}>
        {FALLING_COINS.slice(0, 6).map((coin) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={coin.left}
            src={AUTH_COIN_SRC}
            alt=""
            className={styles.staticArt}
            style={{ left: coin.left, width: coin.sizePx }}
          />
        ))}
      </div>
    </>
  );
}
