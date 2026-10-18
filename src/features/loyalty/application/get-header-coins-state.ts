"use server";

import { getUserBonusBalance } from "@/features/loyalty/application/queries";
import { getCurrentUser } from "@/lib/auth/session";

export type HeaderCoinsStateDto = {
  isSignedIn: boolean;
  balanceAmount: number;
};

const GUEST_STATE: HeaderCoinsStateDto = {
  isSignedIn: false,
  balanceAmount: 0,
};

/**
 * Session-scoped header coins pill for ISR catalog/PDP HTML.
 * Static RSC stays cookie-free; the client hydrates this after paint.
 */
export async function getHeaderCoinsStateAction(): Promise<HeaderCoinsStateDto> {
  const user = await getCurrentUser();
  if (!user) {
    return GUEST_STATE;
  }

  return {
    isSignedIn: true,
    balanceAmount: await getUserBonusBalance(user.id),
  };
}
