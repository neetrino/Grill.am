import { AUTH_FIRE_SRC } from "@/features/auth/content/auth-assets";
import { AuthFallingCoins } from "@/features/auth/ui/AuthFallingCoins";

type AuthFireDecorProps = {
  showCoins: boolean;
};

/**
 * Figma fire graphic, plus a falling-coin rain on the guest-coins login.
 * Coins-entry login hides the fire on mobile so it does not sit under the sheet.
 */
export function AuthFireDecor({ showCoins }: AuthFireDecorProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Sit in the first viewport so flames (and coins) stay above the footer. */}
      <div className="absolute inset-x-0 top-0 h-dvh">
        {/* Static public asset; native img keeps the SVG grain filter intact. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AUTH_FIRE_SRC}
          alt=""
          className={`absolute bottom-0 left-0 h-auto w-full max-w-none -translate-y-8 ${
            showCoins ? "max-lg:hidden" : ""
          }`}
        />
        {showCoins ? <AuthFallingCoins /> : null}
      </div>
    </div>
  );
}
