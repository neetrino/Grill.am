"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useLayoutEffect } from "react";

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
}: {
  tidioSrc?: string;
  useCrisp: boolean;
  locale: Locale;
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
              bindTidioLauncherConceal();
              concealTidioLauncher();
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
            bindCrispLauncherConceal();
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
}: TidioChatProps) {
  const pathname = usePathname() ?? "";
  const tidioSrc = publicKey ? tidioWidgetScriptUrl(publicKey) : undefined;
  const useCrisp = Boolean(crispWebsiteId) && !tidioSrc;
  const enabled = isTidioEnabledPath(pathname, locale);

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
    }
  }, [crispWebsiteId, enabled, locale, tidioSrc, useCrisp]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <StorefrontChatScripts
        tidioSrc={tidioSrc}
        useCrisp={useCrisp}
        locale={locale}
      />
      <ChatLauncherButton
        label={openLabel}
        onClick={() => openStorefrontChat(tidioSrc, crispWebsiteId, locale)}
      />
    </>
  );
}
