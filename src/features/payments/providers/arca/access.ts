import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { orders } from "@/db/schema";
import { getDb } from "@/db/client";
import {
  orderAccessCookieName,
  verifyGuestOrderAccessToken,
} from "@/features/payments/domain/order-access-token";
import { getCurrentUser } from "@/lib/auth/session";

export class PaymentAccessDeniedError extends Error {
  constructor() {
    super("Payment access denied.");
    this.name = "PaymentAccessDeniedError";
  }
}

/**
 * Verifies the caller may act on the order (owner, staff, or guest token cookie).
 * Order number alone is never sufficient.
 */
export async function assertOrderPaymentAccess(orderId: string): Promise<{
  order: typeof orders.$inferSelect;
  actor: "owner" | "staff" | "guest";
}> {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new PaymentAccessDeniedError();
  }

  const user = await getCurrentUser();
  const isStaff = user?.role === "ADMIN" || user?.role === "OPERATOR";
  if (isStaff) {
    return { order, actor: "staff" };
  }

  if (order.userId) {
    if (user?.id && user.id === order.userId) {
      return { order, actor: "owner" };
    }
    throw new PaymentAccessDeniedError();
  }

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(orderAccessCookieName(order.orderNumber))
    ?.value;
  const ok = verifyGuestOrderAccessToken(
    rawToken ?? "",
    order.guestAccessTokenHash,
    order.guestAccessExpiresAt,
  );
  if (!ok) {
    throw new PaymentAccessDeniedError();
  }
  return { order, actor: "guest" };
}

export async function assertPaymentBelongsToOrder(args: {
  paymentId: string;
  orderId: string;
}): Promise<void> {
  const { payments } = await import("@/db/schema");
  const [row] = await getDb()
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.id, args.paymentId),
        eq(payments.orderId, args.orderId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new PaymentAccessDeniedError();
  }
}
