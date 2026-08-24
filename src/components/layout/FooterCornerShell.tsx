"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isAuthSurfacePath } from "@/lib/routes/auth-surface-path";

type FooterCornerShellProps = {
  children: ReactNode;
};

/** Routes whose desktop shell paints the gray page wash behind the footer. */
const GRAY_SHELL_PATTERNS = [
  /\/profile(?:\/|$)/,
  /\/wishlist(?:\/|$)/,
  // Product detail only — the catalog list keeps a white shell.
  /\/products\/[^/]+(?:\/|$)/,
];

/**
 * Desktop footer sits on a wash that fills the rounded corner reveals.
 * Gray shells match the page wash; elsewhere white.
 */
export function FooterCornerShell({ children }: FooterCornerShellProps) {
  const pathname = usePathname() ?? "";
  const isAuthPage = isAuthSurfacePath(pathname);
  const grayCorners = GRAY_SHELL_PATTERNS.some((pattern) =>
    pattern.test(pathname),
  );

  return (
    <div
      className={`mt-auto hidden lg:block ${
        isAuthPage
          ? "storefront-bleed bg-transparent"
          : grayCorners
            ? "bg-[#f2f0f0]"
            : "bg-white"
      }`}
    >
      {children}
    </div>
  );
}
