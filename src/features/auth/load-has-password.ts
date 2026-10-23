import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";

/**
 * Reports whether the user already has a password hash.
 * The hash itself is not returned.
 */
export async function loadHasPassword(userId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row !== undefined && row.passwordHash !== null;
}
