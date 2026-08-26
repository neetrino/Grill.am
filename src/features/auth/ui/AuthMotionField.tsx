"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useState,
  type FocusEvent,
  type InputEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

type AuthMotionFieldProps = {
  children: ReactNode;
  className?: string;
  /** Stagger index for first-render entrance. */
  index?: number;
};

/** Staggered entrance wrapper for auth form rows. */
export function AuthMotionField({
  children,
  className,
  index = 0,
}: AuthMotionFieldProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.55,
        delay: 0.42 + index * 0.08,
        ease: EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

type AuthAnimatedInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
> & {
  className: string;
};

/**
 * Text input with focus underline draw + typing pulse.
 * Shared by login/register for a consistent interactive feel.
 */
export function AuthAnimatedInput({
  className,
  onFocus,
  onBlur,
  onInput,
  ...props
}: AuthAnimatedInputProps) {
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  const handleInput = useCallback(
    (event: InputEvent<HTMLInputElement>) => {
      if (!reduceMotion) {
        setPulseKey((value) => value + 1);
      }
      onInput?.(event);
    },
    [onInput, reduceMotion],
  );

  return (
    <motion.div
      className="relative"
      animate={
        reduceMotion
          ? undefined
          : focused
            ? { y: -1, scale: 1.01 }
            : { y: 0, scale: 1 }
      }
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <input
        {...props}
        className={className}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
      />

      <motion.span
        className="pointer-events-none absolute right-3 bottom-0 left-3 h-[2.5px] origin-left rounded-full bg-brand-yellow"
        initial={false}
        animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        aria-hidden
      />

      <motion.span
        className="pointer-events-none absolute inset-0 rounded-[20px]"
        animate={
          reduceMotion
            ? undefined
            : {
                boxShadow: focused
                  ? "0 0 0 3px rgba(255,193,44,0.22)"
                  : "0 0 0 0px rgba(255,193,44,0)",
              }
        }
        transition={{ duration: 0.28 }}
        aria-hidden
      />

      {!reduceMotion ? (
        <motion.span
          key={pulseKey}
          className="pointer-events-none absolute top-1/2 left-3 size-1.5 -translate-y-1/2 rounded-full bg-brand-red"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.15, 0.6] }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          aria-hidden
        />
      ) : null}
    </motion.div>
  );
}
