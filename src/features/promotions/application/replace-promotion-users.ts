import { eq, inArray } from "drizzle-orm";

import { promotionUsers, users } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { createId } from "@/lib/id";

type DbTransaction = Parameters<Parameters<typeof withTransaction>[0]>[0];

/** Ensures every id exists before writing `promotion_users`. */
export async function assertPromotionUsersExist(
  tx: DbTransaction,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  const found = await tx
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.id, userIds));

  if (found.length !== userIds.length) {
    throw new Error("INVALID_USERS");
  }
}

/** Replaces the allowlist; empty clears restriction (all users). */
export async function replacePromotionUsers(
  tx: DbTransaction,
  promotionId: string,
  userIds: string[],
): Promise<void> {
  await tx
    .delete(promotionUsers)
    .where(eq(promotionUsers.promotionId, promotionId));

  if (userIds.length === 0) {
    return;
  }

  await tx.insert(promotionUsers).values(
    userIds.map((userId) => ({
      id: createId(),
      promotionId,
      userId,
    })),
  );
}
