"use client";

import gsap from "gsap";
import { getImageProps } from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

import {
  AUTH_BACKGROUND_IMAGE,
  AUTH_BACKGROUND_IMAGE_MOBILE,
} from "@/features/auth/content/auth-assets";
import { AuthPageBackdrop } from "@/features/auth/ui/AuthPageBackdrop";

const EASE = [0.16, 1, 0.3, 1] as const;

const AUTH_BG_IMAGE_CLASS =
  "absolute inset-0 h-full w-full object-cover object-center brightness-[1.06] contrast-[1.05] saturate-[1.1]";

function AuthBackgroundArt() {
  const common = {
    alt: "",
    priority: true,
    sizes: "100vw",
    quality: 82,
  } as const;

  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({
    ...common,
    src: AUTH_BACKGROUND_IMAGE_MOBILE,
    width: 1024,
    height: 1536,
  });
  const {
    props: { srcSet: desktopSrcSet, ...desktopRest },
  } = getImageProps({
    ...common,
    src: AUTH_BACKGROUND_IMAGE,
    width: 1920,
    height: 1080,
  });

  return (
    <picture className="absolute inset-0 block h-full w-full">
      <source media="(max-width: 1023px)" srcSet={mobileSrcSet} sizes="100vw" />
      <source media="(min-width: 1024px)" srcSet={desktopSrcSet} sizes="100vw" />
      <img
        {...desktopRest}
        alt=""
        className={AUTH_BG_IMAGE_CLASS}
        suppressHydrationWarning
      />
    </picture>
  );
}

type AuthPosterShellProps = {
  mode: "login" | "register";
  /** Form card heading. */
  formLead: string;
  formAccent: string;
  children: ReactNode;
};

function PosterCorner({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      data-poster-corner
      className={`pointer-events-none absolute size-3.5 border-brand-yellow/80 ${className ?? ""}`}
      aria-hidden
      {...props}
    />
  );
}

/**
 * Shared Poster Gate stage for login + register.
 * Backdrop is portaled to `body` for true full-viewport coverage.
 */
export function AuthPosterShell({
  mode,
  formLead,
  formAccent,
  children,
}: AuthPosterShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const backdrop = backdropRef.current;
    if (!root || !backdrop || reduceMotion) {
      return;
    }

    const cardCtx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline
        .fromTo(
          root.querySelector("[data-poster-stage]"),
          { opacity: 0 },
          { opacity: 1, duration: 0.55 },
        )
        .fromTo(
          root.querySelector("[data-poster-shadow]"),
          { x: 24, y: 24, opacity: 0 },
          { x: 0, y: 0, opacity: 1, duration: 0.75 },
          "-=0.35",
        )
        .fromTo(
          root.querySelector("[data-poster-card]"),
          { y: 28, opacity: 0, rotate: 1.2, filter: "blur(10px)" },
          {
            y: 0,
            opacity: 1,
            rotate: 0,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power4.out",
          },
          "-=0.55",
        )
        .fromTo(
          root.querySelectorAll("[data-poster-corner]"),
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.35,
            stagger: 0.05,
            ease: "back.out(2.2)",
          },
          "-=0.45",
        )
        .fromTo(
          root.querySelector("[data-poster-rule]"),
          { scaleX: 0 },
          { scaleX: 1, duration: 0.55 },
          "-=0.2",
        );
    }, root);

    const backdropCtx = gsap.context(() => {
      gsap.fromTo(
        backdrop.querySelector("[data-poster-bg]"),
        { scale: 1.12, opacity: 0.4 },
        { scale: 1.04, opacity: 1, duration: 1.35, ease: "power2.out" },
      );

      gsap.to(backdrop.querySelector("[data-poster-bg]"), {
        scale: 1.08,
        duration: 22,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1.5,
      });

      gsap.to(backdrop.querySelectorAll("[data-poster-glow]"), {
        y: -12,
        opacity: 0.55,
        duration: 4.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.8,
      });
    }, backdrop);

    return () => {
      cardCtx.revert();
      backdropCtx.revert();
    };
  }, [mode, reduceMotion]);

  return (
    <>
      <AuthPageBackdrop ref={backdropRef}>
        <div data-poster-bg className="absolute inset-0 will-change-transform">
          <AuthBackgroundArt />
        </div>
        <div className="absolute inset-0 bg-brand-ink/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(7,16,20,0.62)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-ink/20 via-transparent to-brand-ink/35" />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-red/10 via-transparent to-brand-yellow/12" />
        <div
          data-poster-glow
          className="absolute -top-20 left-[12%] size-56 rounded-full bg-brand-red/12 blur-3xl"
        />
        <div
          data-poster-glow
          className="absolute right-[10%] -bottom-16 size-48 rounded-full bg-brand-yellow/10 blur-3xl"
        />
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,193,44,0.14) 0.5px, transparent 0.5px)",
            backgroundSize: "3px 3px",
          }}
        />
      </AuthPageBackdrop>

      <div
        ref={rootRef}
        className="storefront-bleed relative z-[2] -mt-10 -mb-28 min-h-dvh lg:-mb-10"
      >
        <section
          data-poster-stage
          className="relative flex min-h-dvh px-5 pt-[calc(var(--storefront-header-offset,5rem)+1rem)] pb-28 sm:px-8 sm:pt-[calc(var(--storefront-header-offset,5rem)+1.5rem)] lg:px-10 lg:pb-10"
        >
          <div className="relative mx-auto my-auto w-full max-w-[420px] -translate-y-24 sm:-translate-y-28">
            <div
              data-poster-shadow
              className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-[22px] bg-brand-yellow sm:translate-x-3 sm:translate-y-3"
              aria-hidden
            />

            <motion.div
              data-poster-card
              className="relative overflow-hidden rounded-[22px] border-[3px] border-brand-ink bg-white/95 p-6 shadow-[0_28px_90px_rgba(7,16,20,0.32)] backdrop-blur-xl sm:p-8"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 16, filter: "blur(8px)", rotate: 0.6 }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", rotate: 0 }}
              transition={{ duration: 0.85, delay: 0.12, ease: EASE }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-12deg, transparent, transparent 14px, rgba(7,16,20,0.5) 14px, rgba(7,16,20,0.5) 15px)",
                }}
                aria-hidden
              />

              <PosterCorner className="top-3.5 left-3.5 border-t-2 border-l-2" />
              <PosterCorner className="top-3.5 right-3.5 border-t-2 border-r-2" />
              <PosterCorner className="bottom-3.5 left-3.5 border-b-2 border-l-2" />
              <PosterCorner className="right-3.5 bottom-3.5 border-r-2 border-b-2" />

              <motion.div
                className="relative mb-7 border-b-[3px] border-brand-ink pb-5"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.28, ease: EASE }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h1 className="font-auth-display text-[1.65rem] leading-[1.15] font-extrabold tracking-[-0.03em] text-brand-ink sm:text-[1.85rem]">
                    <span className="text-brand-red">{formLead}</span>{" "}
                    <span className="text-brand-ink">{formAccent}</span>
                  </h1>
                  <span
                    className="mt-1 size-3 shrink-0 bg-brand-red"
                    aria-hidden
                  />
                </div>
                <div
                  data-poster-rule
                  className="mt-4 h-[3px] w-16 origin-left bg-brand-yellow"
                  aria-hidden
                />
              </motion.div>

              <div className="relative">{children}</div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
