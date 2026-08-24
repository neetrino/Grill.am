"use client";

import {
  forwardRef,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type AuthPageBackdropProps = {
  children: ReactNode;
};

/** Portals the auth backdrop to `document.body` so it spans the full viewport. */
export const AuthPageBackdrop = forwardRef<HTMLDivElement, AuthPageBackdropProps>(
  function AuthPageBackdrop({ children }, ref) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      document.body.classList.add("auth-page-active");
      return () => {
        document.body.classList.remove("auth-page-active");
      };
    }, []);

    if (!mounted) {
      return null;
    }

    return createPortal(
      <div
        ref={ref}
        data-auth-backdrop
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        {children}
      </div>,
      document.body,
    );
  },
);
