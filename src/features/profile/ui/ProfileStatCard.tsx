import type { ReactNode } from "react";

import {
  PROFILE_CARD_FLAT_CLASS,
  PROFILE_ICON_TONE,
} from "@/features/profile/ui/profile-ui";

type ProfileStatCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  className?: string;
  /** Skip the yellow chip — use for art that is already circular (e.g. coin). */
  iconPlain?: boolean;
  /** Override chip colors; defaults to profile yellow icon tone. */
  iconTone?: { background: string; foreground: string };
};

export function ProfileStatCard({
  label,
  value,
  icon,
  className = "",
  iconPlain = false,
  iconTone = PROFILE_ICON_TONE,
}: ProfileStatCardProps) {
  return (
    <div
      className={`relative flex items-center overflow-hidden px-3 py-3 transition-transform duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-6 sm:py-4 ${PROFILE_CARD_FLAT_CLASS} ${className}`.trim()}
    >
      <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
        {iconPlain ? (
          <div className="flex shrink-0 items-center justify-center">
            {icon}
          </div>
        ) : (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full sm:size-11 [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5"
            style={{
              backgroundColor: iconTone.background,
              color: iconTone.foreground,
            }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs leading-snug font-medium text-gray-600 sm:text-sm">
            {label}
          </p>
          <p className="mt-0.5 truncate text-lg font-bold tracking-tight text-gray-900 tabular-nums sm:text-2xl">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
