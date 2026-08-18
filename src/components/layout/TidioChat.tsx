"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useLayoutEffect, useState } from "react";

import { ChatLauncherButton } from "@/components/layout/ChatLauncherButton";
import type { Locale } from "@/lib/i18n/config";
import {
  bindCrispLauncherConceal,
  bootCrisp,
  concealCrispLauncher,
  CRISP_CHAT_SCRIPT_URL,
  openCrispChat,
} from "@/lib/crisp/widget";
import { isTidioEnabledPath } from "@/lib/tidio/paths";
import { tidioWidgetScriptUrl } from "@/lib/tidio/public-key";
import {
  applyTidioHomeCopy,
  type TidioHomeCopy,
} from "@/lib/tidio/home-copy";
import {
  bindTidioLauncherConceal,
  concealTidioLauncher,
  hideTidioWidget,
  openTidioChat,
  setTidioChatLang,
} from "@/lib/tidio/widget";

type TidioChatProps = {
  publicKey?: string;
  crispWebsiteId?: string;
  locale: Locale;
  openLabel: string;
  greeting: string;
  homeCopy: TidioHomeCopy;
};

function openStorefrontChat(
  tidioSrc: string | undefined,
  crispWebsiteId: string | undefined,
  locale: Locale,
): void {
  if (tidioSrc) {
    openTidioChat();
    return;
  }
  if (crispWebsiteId) {
    bootCrisp(crispWebsiteId, locale);
    openCrispChat();
  }
}

function StorefrontChatScripts({
  tidioSrc,
  useCrisp,
  locale,
  homeCopy,
  onChatClosed,
}: {
  tidioSrc?: string;
  useCrisp: boolean;
  locale: Locale;
  homeCopy: TidioHomeCopy;
  onChatClosed: () => void;
}) {
  return (
    <>
      {tidioSrc ? (
        <>
          <Script id="tidio-chat-lang" strategy="afterInteractive">
            {`document.tidioChatLang = ${JSON.stringify(locale)};`}
          </Script>
          <Script
            id="tidio-chat-widget"
            src={tidioSrc}
            strategy="lazyOnload"
            onReady={() => {
              setTidioChatLang(locale);
              bindTidioLauncherConceal(onChatClosed);
              concealTidioLauncher();
              applyTidioHomeCopy(homeCopy);
            }}
          />
        </>
      ) : null}
      {useCrisp ? (
        <Script
          id="crisp-chat-widget"
          src={CRISP_CHAT_SCRIPT_URL}
          strategy="afterInteractive"
          onReady={() => {
            bindCrispLauncherConceal(onChatClosed);
            concealCrispLauncher();
          }}
        />
      ) : null}
    </>
  );
}

/**
 * Always-on storefront chat icon. Tidio is used when a public key is set;
 * otherwise Crisp (legacy Grill.am widget) opens on click.
 */
export function TidioChat({
  publicKey,
  crispWebsiteId,
  locale,
  openLabel,
  greeting,
  homeCopy,
}: TidioChatProps) {
  const pathname = usePathname() ?? "";
  const tidioSrc = publicKey ? tidioWidgetScriptUrl(publicKey) : undefined;
  const useCrisp = Boolean(crispWebsiteId) && !tidioSrc;
  const enabled = isTidioEnabledPath(pathname, locale);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useLayoutEffect(() => {
    if (!enabled) {
      hideTidioWidget();
      concealCrispLauncher();
      return;
    }
    setTidioChatLang(locale);
    if (useCrisp && crispWebsiteId) {
      bootCrisp(crispWebsiteId, locale);
      concealCrispLauncher();
    }
    if (tidioSrc) {
      concealTidioLauncher();
      applyTidioHomeCopy(homeCopy);
    }
  }, [crispWebsiteId, enabled, homeCopy, locale, tidioSrc, useCrisp]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <StorefrontChatScripts
        tidioSrc={tidioSrc}
        useCrisp={useCrisp}
        locale={locale}
        homeCopy={homeCopy}
        onChatClosed={() => setIsChatOpen(false)}
      />
      <ChatLauncherButton
        label={openLabel}
        greeting={greeting}
        showGreeting={!isChatOpen}
        onClick={() => {
          setIsChatOpen(true);
          openStorefrontChat(tidioSrc, crispWebsiteId, locale);
          applyTidioHomeCopy(homeCopy);
        }}
      />
    </>
  );
}
