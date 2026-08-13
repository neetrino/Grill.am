"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
} from "react";

import { HeroArtImage } from "@/features/home/ui/HeroArtImage";
import { HeroSplash } from "@/features/home/ui/HeroSplash";

type Point = { x: number; y: number };

const ORIGIN: Point = { x: 0, y: 0 };
const DROP_MS = 920;
const SPLASH_AT_MS = 640;
const SPLASH_END_MS = 1800;
const AWAY_PX = 56;

function subscribeReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function HeroPlate({ hit }: { hit: boolean }) {
  return (
    <svg
      viewBox="0 0 520 150"
      className={`h-full w-full overflow-visible ${hit ? "hero-plate-hit" : ""}`}
      aria-hidden
    >
      <ellipse cx="260" cy="112" rx="228" ry="22" fill="rgba(0,0,0,0.18)" />
      <ellipse cx="260" cy="72" rx="248" ry="52" fill="#fff" />
      <ellipse cx="260" cy="68" rx="198" ry="34" fill="#f3eee4" />
      <ellipse cx="260" cy="58" rx="128" ry="14" fill="rgba(255,255,255,0.78)" />
    </svg>
  );
}

function useChickenDrag(
  enabled: boolean,
  onReleaseAway: () => void,
) {
  const [offset, setOffset] = useState<Point>(ORIGIN);
  const [lifted, setLifted] = useState(false);
  const drag = useRef<{ id: number; originX: number; originY: number } | null>(
    null,
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!enabled) {
        return;
      }
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = {
        id: event.pointerId,
        originX: event.clientX - offset.x,
        originY: event.clientY - offset.y,
      };
      setLifted(true);
    },
    [enabled, offset.x, offset.y],
  );

  const onPointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) {
      return;
    }
    setOffset({
      x: event.clientX - drag.current.originX,
      y: event.clientY - drag.current.originY,
    });
  }, []);

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!drag.current || drag.current.id !== event.pointerId) {
        return;
      }
      const away = Math.hypot(offset.x, offset.y) > AWAY_PX;
      drag.current = null;
      setLifted(false);
      setOffset(ORIGIN);
      if (away) {
        onReleaseAway();
      }
    },
    [offset.x, offset.y, onReleaseAway],
  );

  return { offset, lifted, onPointerDown, onPointerMove, onPointerUp };
}

function useDropSequence(reduceMotion: boolean, dropId: number) {
  const [landed, setLanded] = useState(reduceMotion);
  const [splashing, setSplashing] = useState(false);

  if (reduceMotion && !landed) {
    setLanded(true);
  }

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const splashAt = window.setTimeout(() => setSplashing(true), SPLASH_AT_MS);
    const landAt = window.setTimeout(() => setLanded(true), DROP_MS);
    const splashEnd = window.setTimeout(() => setSplashing(false), SPLASH_END_MS);

    return () => {
      window.clearTimeout(splashAt);
      window.clearTimeout(landAt);
      window.clearTimeout(splashEnd);
    };
  }, [dropId, reduceMotion]);

  return { landed, splashing, setLanded, setSplashing };
}

function HeroChickenButton({
  src,
  grabLabel,
  dropId,
  landed,
  lifted,
  offset,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  src: string;
  grabLabel: string;
  dropId: number;
  landed: boolean;
  lifted: boolean;
  offset: Point;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
}) {
  const liftY = lifted ? -28 : 0;
  const scale = lifted ? 1.05 : 1;

  return (
    <div className="absolute bottom-[-16%] left-1/2 z-30 h-[74%] w-[92%] -translate-x-1/2 md:bottom-[-17%]">
      <button
        type="button"
        aria-label={grabLabel}
        aria-grabbed={lifted}
        aria-disabled={!landed}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`absolute inset-0 touch-none select-none ${
          landed ? "pointer-events-auto cursor-grab" : "pointer-events-none"
        } ${lifted ? "cursor-grabbing" : ""}`}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y + liftY}px, 0) scale(${scale})`,
          transition:
            lifted || !landed
              ? "none"
              : "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <span
          key={dropId}
          className={`absolute inset-0 ${landed ? "" : "hero-chicken-drop"}`}
        >
          <HeroArtImage
            src={src}
            alt=""
            fill
            instant
            priority
            draggable={false}
            sizes="(max-width: 768px) 70vw, 55vw"
              className="pointer-events-none origin-bottom translate-y-0 scale-[1.4] object-contain object-bottom drop-shadow-[0_14px_12px_rgba(0,0,0,0.32)] md:scale-[1.48]"
          />
        </span>
      </button>
    </div>
  );
}

type HeroChickenPlateProps = {
  src: string;
  grabLabel: string;
};

export function HeroChickenPlate({ src, grabLabel }: HeroChickenPlateProps) {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const [dropId, setDropId] = useState(0);
  const { landed, splashing, setLanded, setSplashing } = useDropSequence(
    reduceMotion,
    dropId,
  );
  const replayDrop = useCallback(() => {
    if (reduceMotion) {
      return;
    }
    setSplashing(false);
    setLanded(false);
    setDropId((current) => current + 1);
  }, [reduceMotion, setLanded, setSplashing]);
  const drag = useChickenDrag(landed, replayDrop);

  return (
    <div className="pointer-events-none absolute right-[-2%] bottom-3 z-20 h-[min(96%,680px)] w-[62%] overflow-visible md:bottom-4 md:w-[56%]">
      <div className="absolute bottom-[-3%] left-1/2 z-10 h-[40%] w-[112%] -translate-x-1/2 md:bottom-[-4%] md:h-[42%] md:w-[118%]">
        <HeroPlate hit={splashing} />
        <HeroSplash active={splashing} burstId={dropId} />
      </div>
      <HeroChickenButton
        src={src}
        grabLabel={grabLabel}
        dropId={dropId}
        landed={landed}
        {...drag}
      />
    </div>
  );
}
