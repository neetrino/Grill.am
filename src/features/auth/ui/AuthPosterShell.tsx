"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { AuthFireDecor } from "@/features/auth/ui/AuthFireDecor";

const EASE = [0.16, 1, 0.3, 1] as const;
const AUTH_STAGE_ROOT = "[data-auth-stage-root]";

function subscribeNoop(): () => void {
  return () => undefined;
}

function getAuthStageRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(AUTH_STAGE_ROOT);
}

function useAuthStageRoot(): HTMLElement | null {
  return useSyncExternalStore(subscribeNoop, getAuthStageRoot, () => null);
}

type AuthPosterShellProps = {
  mode: "login" | "register";
  formLead: string;
  formAccent: string;
  subtitle?: string;
  /** Falling coin rain on the fire stage (guest coins login). */
  showCoins?: boolean;
  /** Left-side coins explainer (guest coins login). */
  aside?: ReactNode;
  children: ReactNode;
};

/**
 * Red fire stage for login + register — Figma login page.
 */
export function AuthPosterShell({
  mode,
  formLead,
  formAccent,
  subtitle,
  showCoins = false,
  aside = null,
  children,
}: AuthPosterShellProps) {
  const reduceMotion = useReducedMotion();
  const stageRoot = useAuthStageRoot();
  const hasAside = aside != null;
  const stageMaxWidth = hasAside
    ? "max-w-[420px] lg:max-w-[920px]"
    : mode === "register"
      ? "max-w-[560px]"
      : "max-w-[420px]";

  return (
    <>
      {stageRoot
        ? createPortal(
            <AuthFireDecor showCoins={showCoins} />,
            stageRoot,
          )
        : null}

      <section className="storefront-bleed relative z-[1] -mt-10 -mb-28 lg:-mb-10">
        <div
          data-poster-stage
          className="relative mx-auto flex w-full max-w-[1440px] flex-col px-5 pt-16 pb-28 max-lg:min-h-[calc(100dvh-var(--storefront-header-offset,9.5rem))] sm:px-8 sm:pt-20 lg:px-10 lg:pt-24 lg:pb-16"
        >
          <motion.header
            className="relative text-center"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <h1 className="font-sans text-[clamp(2rem,5vw,3.75rem)] leading-[0.98] font-black tracking-[-0.02em] uppercase">
              <span className="text-[#171717]">{formLead}</span>{" "}
              <span className="text-white">{formAccent}</span>
            </h1>
            {subtitle ? (
              <p className="mt-3 text-base font-medium text-white/90">
                {subtitle}
              </p>
            ) : null}
          </motion.header>

          <div
            className={`relative mx-auto w-full ${stageMaxWidth} ${
              hasAside
                ? "mt-14 grid items-stretch gap-5 lg:mt-16 lg:grid-cols-2 lg:gap-6"
                : mode === "register"
                  ? "mt-6"
                  : "mt-14 lg:mt-16"
            }`}
          >
            {hasAside ? (
              <motion.div
                data-poster-card
                className="relative min-h-0 max-lg:hidden"
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: 16, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.85, delay: 0.08, ease: EASE }}
              >
                {aside}
              </motion.div>
            ) : null}
            <motion.div
              data-poster-card
              className="relative overflow-hidden rounded-[22px] bg-white p-6 shadow-[0_28px_90px_rgba(7,16,20,0.32)] sm:p-8"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, y: 18, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
