"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

type AboutRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

/** Scroll-time reveal via Motion — blur + lift; respects reduced-motion. */
export function AboutReveal({
  children,
  className,
  delay = 0,
  y = 36,
}: AboutRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -48px 0px" }}
      transition={{ duration: 0.85, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

type AboutStaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

/** Parent for staggered children using AboutStaggerItem. */
export function AboutStagger({
  children,
  className,
  stagger = 0.1,
}: AboutStaggerProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -40px 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: 0.06 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type AboutStaggerItemProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  className?: string;
  y?: number;
  from?: "up" | "left" | "right";
};

export function AboutStaggerItem({
  children,
  className,
  y = 28,
  from = "up",
  ...props
}: AboutStaggerItemProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const hidden =
    from === "left"
      ? { opacity: 0, x: -36, y: 12, rotate: -2 }
      : from === "right"
        ? { opacity: 0, x: 36, y: 12, rotate: 2 }
        : { opacity: 0, y, scale: 0.96 };

  return (
    <motion.div
      className={className}
      variants={{
        hidden,
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotate: 0,
          transition: { duration: 0.7, ease: EASE },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type AboutHeroMotionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** First-render hero entrance — mount choreography, not scroll. */
export function AboutHeroMotion({
  children,
  className,
  delay = 0,
}: AboutHeroMotionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
