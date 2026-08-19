"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

const BRANCH_APPEAR_STAGGER_MS = 80;
const BRANCH_APPEAR_DURATION_MS = 640;
const BRANCH_APPEAR_MAX_INDEX = 8;

export function branchAppearStyle(index: number): CSSProperties {
  return {
    "--product-appear-delay": `${Math.min(index, BRANCH_APPEAR_MAX_INDEX) * BRANCH_APPEAR_STAGGER_MS}ms`,
    "--product-appear-duration": `${BRANCH_APPEAR_DURATION_MS}ms`,
  } as CSSProperties;
}

export function branchAppearClass(active: boolean): string {
  return active ? "animate-catalog-grid-in" : "product-appear-pending";
}

/** Reveals the home branches band once it enters the viewport. */
export function useViewportReveal(): {
  sectionRef: RefObject<HTMLElement | null>;
  revealed: boolean;
} {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) {
      return;
    }

    function reveal(): void {
      setRevealed(true);
    }

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      const frameId = window.requestAnimationFrame(reveal);
      return () => window.cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        reveal();
        observer.disconnect();
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { sectionRef, revealed };
}
