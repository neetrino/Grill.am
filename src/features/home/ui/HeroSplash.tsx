"use client";

import type { CSSProperties } from "react";

const SPLASH_DROPS = [
  { dx: -210, dy: -10, w: 28, h: 11, delay: "0ms", color: "#ff9a1f", rotate: -12 },
  { dx: 218, dy: -8, w: 30, h: 12, delay: "30ms", color: "#f52516", rotate: 10 },
  { dx: -150, dy: -18, w: 22, h: 10, delay: "50ms", color: "#ffc12c", rotate: -8 },
  { dx: 158, dy: -16, w: 24, h: 10, delay: "40ms", color: "#ff7a1a", rotate: 8 },
  { dx: -96, dy: -36, w: 14, h: 20, delay: "20ms", color: "#e86a1a", rotate: -22 },
  { dx: 102, dy: -38, w: 15, h: 22, delay: "25ms", color: "#db0b20", rotate: 24 },
  { dx: -64, dy: -8, w: 18, h: 8, delay: "10ms", color: "#ffb347", rotate: -4 },
  { dx: 70, dy: -6, w: 18, h: 8, delay: "15ms", color: "#ffd163", rotate: 4 },
  { dx: -268, dy: 6, w: 26, h: 12, delay: "70ms", color: "#c45a12", rotate: -6 },
  { dx: 274, dy: 8, w: 28, h: 12, delay: "80ms", color: "#ff9a1f", rotate: 6 },
  { dx: -38, dy: -22, w: 12, h: 16, delay: "5ms", color: "#fff6e8", rotate: -14 },
  { dx: 42, dy: -24, w: 12, h: 16, delay: "8ms", color: "#ffe08a", rotate: 16 },
  { dx: -186, dy: 18, w: 16, h: 22, delay: "90ms", color: "#f52516", rotate: 18 },
  { dx: 192, dy: 20, w: 16, h: 22, delay: "100ms", color: "#ff7a1a", rotate: -16 },
  { dx: -120, dy: 4, w: 20, h: 9, delay: "55ms", color: "#ffc12c", rotate: -2 },
  { dx: 128, dy: 6, w: 20, h: 9, delay: "60ms", color: "#db0b20", rotate: 2 },
] as const;

type HeroSplashProps = {
  active: boolean;
  burstId: number;
};

export function HeroSplash({ active, burstId }: HeroSplashProps) {
  if (!active) {
    return null;
  }

  return (
    <div
      key={burstId}
      className="pointer-events-none absolute top-[34%] left-1/2 z-20 h-0 w-0"
      aria-hidden
    >
      <span className="hero-splash-burst" />
      {SPLASH_DROPS.map((drop) => (
        <span
          key={`${drop.dx}-${drop.dy}-${drop.delay}`}
          className="hero-splash-drop absolute"
          style={
            {
              width: drop.w,
              height: drop.h,
              marginLeft: -drop.w / 2,
              marginTop: -drop.h / 2,
              background: drop.color,
              animationDelay: drop.delay,
              "--splash-x": `${drop.dx}px`,
              "--splash-y": `${drop.dy}px`,
              "--splash-r": `${drop.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
