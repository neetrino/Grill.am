"use client";

import { MessageCircle } from "lucide-react";

type ChatLauncherButtonProps = {
  label: string;
  greeting: string;
  showGreeting: boolean;
  isOpen: boolean;
  onClick: () => void;
};

const LAUNCHER_ROOT_CLASS =
  "pointer-events-auto fixed right-4 bottom-[var(--storefront-chat-mobile-bottom)] z-[10000050] flex items-center gap-2.5 lg:right-6 lg:bottom-6";

const GREETING_CLASS =
  "hidden max-w-[15.25rem] truncate rounded-full bg-white px-5 py-3 text-left text-sm font-medium text-brand-ink shadow-[0_8px_24px_rgba(15,23,42,0.1)] lg:inline-block";

const ICON_CLASS =
  "flex size-14 shrink-0 items-center justify-center rounded-full bg-[#FEC12B] text-brand-ink transition hover:brightness-95";

/** Viewport-fixed chat icon so it never scrolls away with the page. */
export function ChatLauncherButton({
  label,
  greeting,
  showGreeting,
  isOpen,
  onClick,
}: ChatLauncherButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={isOpen}
      onClick={onClick}
      className={`${LAUNCHER_ROOT_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEC12B]`}
    >
      {showGreeting ? (
        <span aria-hidden="true" className={GREETING_CLASS}>
          {greeting}
        </span>
      ) : null}
      <span className={ICON_CLASS}>
        <MessageCircle className="size-7" strokeWidth={2} aria-hidden="true" />
      </span>
    </button>
  );
}
