"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type FooterCornerShellProps = {
  children: ReactNode;
};

/**
 * Desktop footer sits on a wash that fills the rounded corner reveals.
 * Gray shells (profile / wishlist / stores) match page wash; elsewhere white.
 */
export function FooterCornerShell({ children }: FooterCornerShellProps) {
  const pathname = usePathname() ?? "";
  const grayCorners =
    /\/profile(?:\/|$)/.test(pathname) ||
    /\/wishlist(?:\/|$)/.test(pathname) ||
    /\/stores(?:\/|$)/.test(pathname);

  return (
    <div
      className={`mt-auto hidden md:block ${
        grayCorners ? "bg-[#f2f0f0]" : "bg-white"
      }`}
    >
      {children}
    </div>
  );
}
