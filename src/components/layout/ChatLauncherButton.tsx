"use client";

import { MessageCircle } from "lucide-react";

type ChatLauncherButtonProps = {
  label: string;
  onClick: () => void;
};

/** Viewport-fixed chat icon so it never scrolls away with the page. */
export function ChatLauncherButton({ label, onClick }: ChatLauncherButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[45] flex size-14 items-center justify-center rounded-full bg-brand-red text-white shadow-[0_8px_24px_rgba(219,11,32,0.35)] transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red max-lg:bottom-[5.75rem] lg:right-6 lg:bottom-6"
    >
      <MessageCircle className="size-7" strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
