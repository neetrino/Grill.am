"use client";

import { useEffect, type ReactNode } from "react";

import { DesktopFluidFrame } from "@/components/layout/DesktopFluidFrame";

type StorefrontSurfaceProps = {
  children: ReactNode;
};

/**
 * White page wash under chrome and above the rounded footer —
 * corner reveals stay white on every storefront route (shop, careers, etc.).
 * Pages that need a gray band paint it on their own full-bleed roots.
 */
export function StorefrontSurface({ children }: StorefrontSurfaceProps) {
  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#ffffff";
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-1 flex-col overflow-x-clip bg-white">
      <DesktopFluidFrame className="flex min-h-dvh flex-1 flex-col">
        {children}
      </DesktopFluidFrame>
    </div>
  );
}
