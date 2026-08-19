"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useLayoutEffect, useState } from "react";

import { ChatLauncherButton } from "@/components/layout/ChatLauncherButton";
import { isCrispEnabledPath } from "@/lib/crisp/paths";
import {
  bindCrispLauncherConceal,
  bootCrisp,
  closeCrispChat,
  concealCrispLauncher,
  CRISP_CHAT_SCRIPT_URL,
  openCrispChat,
} from "@/lib/crisp/widget";
import type { Locale } from "@/lib/i18n/config";

type CrispChatProps = {
  websiteId?: string;
  locale: Locale;
  openLabel: string;
  greeting: string;
};

/**
 * Always-on storefront chat icon. Crisp opens on click; its native bubble
 * stays hidden so Grill's launcher remains the only icon.
 */
export function CrispChat({
  websiteId,
  locale,
  openLabel,
  greeting,
}: CrispChatProps) {
  const pathname = usePathname() ?? "";
  const enabled = Boolean(websiteId) && isCrispEnabledPath(pathname, locale);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useLayoutEffect(() => {
    if (!enabled || !websiteId) {
      concealCrispLauncher();
      return;
    }
    bootCrisp(websiteId, locale);
    concealCrispLauncher();
  }, [enabled, locale, websiteId]);

  if (!enabled || !websiteId) {
    return null;
  }

  return (
    <>
      <Script
        id="crisp-chat-widget"
        src={CRISP_CHAT_SCRIPT_URL}
        strategy="afterInteractive"
        onReady={() => {
          bindCrispLauncherConceal(() => setIsChatOpen(false));
          concealCrispLauncher();
        }}
      />
      <ChatLauncherButton
        label={openLabel}
        greeting={greeting}
        showGreeting={!isChatOpen}
        isOpen={isChatOpen}
        onClick={() => {
          if (isChatOpen) {
            setIsChatOpen(false);
            closeCrispChat();
            return;
          }
          setIsChatOpen(true);
          bootCrisp(websiteId, locale);
          openCrispChat();
        }}
      />
    </>
  );
}
