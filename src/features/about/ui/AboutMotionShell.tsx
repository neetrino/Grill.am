"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

type AboutMotionShellProps = {
  children: ReactNode;
};

/**
 * About-page motion runtime: Lenis smooth scroll + GSAP ScrollTrigger
 * (parallax, section lift, timeline draw). Skips when reduced-motion.
 */
export function AboutMotionShell({ children }: AboutMotionShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduceMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const heroMedia = root.querySelector<HTMLElement>("[data-about-hero-media]");
      if (heroMedia) {
        gsap.fromTo(
          heroMedia,
          { scale: 1.08, yPercent: 0 },
          {
            scale: 1,
            yPercent: 12,
            ease: "none",
            scrollTrigger: {
              trigger: heroMedia.closest("section"),
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      root.querySelectorAll<HTMLElement>("[data-about-band]").forEach((band) => {
        gsap.fromTo(
          band,
          { y: 56, opacity: 0.72, scale: 0.985 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            ease: "power3.out",
            duration: 1,
            scrollTrigger: {
              trigger: band,
              start: "top 88%",
              end: "top 55%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      const line = root.querySelector<HTMLElement>("[data-about-timeline-line]");
      if (line) {
        gsap.fromTo(
          line,
          { scaleY: 0, transformOrigin: "top center" },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: line.parentElement,
              start: "top 75%",
              end: "bottom 35%",
              scrub: 0.6,
            },
          },
        );
      }

      root
        .querySelectorAll<HTMLElement>("[data-about-divider]")
        .forEach((divider) => {
          const bars = divider.querySelectorAll<HTMLElement>("[data-about-divider-bar]");
          const ember = divider.querySelector<HTMLElement>("[data-about-divider-ember]");

          gsap.fromTo(
            bars,
            { scaleX: 0, opacity: 0 },
            {
              scaleX: 1,
              opacity: 1,
              duration: 0.85,
              ease: "power2.out",
              stagger: 0.08,
              scrollTrigger: {
                trigger: divider,
                start: "top 90%",
                toggleActions: "play none none reverse",
              },
            },
          );

          if (ember) {
            gsap.fromTo(
              ember,
              { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.55,
                ease: "back.out(2.4)",
                scrollTrigger: {
                  trigger: divider,
                  start: "top 90%",
                  toggleActions: "play none none reverse",
                },
              },
            );
          }
        });
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(ticker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [reduceMotion]);

  return (
    <div ref={rootRef} className="about-motion-shell">
      {children}
    </div>
  );
}
