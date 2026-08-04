"use client";

import dynamic from "next/dynamic";

const SitePopupOverlay = dynamic(
  () =>
    import("@/features/popups/ui/SitePopupOverlay").then((mod) => ({
      default: mod.SitePopupOverlay,
    })),
  { ssr: false },
);

type SitePopupOverlayLazyProps = {
  imageUrl: string;
  closeLabel: string;
};

/** Code-splits the CMS popup so it stays off the storefront critical path. */
export function SitePopupOverlayLazy(props: SitePopupOverlayLazyProps) {
  return <SitePopupOverlay {...props} />;
}
