import "server-only";

import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { phoneOtpChallenges } from "@/db/schema";
import type { OtpPurpose } from "@/lib/auth/otp/constants";
import { replaceActiveChallengeSql } from "@/lib/auth/otp/replace-active-sql";
import type {
  OtpChallengeRecord,
  OtpChallengeRepository,
} from "@/lib/auth/otp/types";

/**
 * Drizzle OTP store.
 * Successful consume is one conditional UPDATE so two callers cannot both win.
 * Replacing the active challenge is one SQL statement on the HTTP client, so
 * SMS OTP does not open a Neon WebSocket transaction.
 */
export function createDrizzleOtpChallengeRepository(): OtpChallengeRepository {
  return {
    replaceActive(record) {
      return replaceActiveChallenge(record);
    },
    findLatestActive(phone, purpose, now) {
      return findLatestActiveChallenge(phone, purpose, now);
    },
    incrementFailedAttempt(id, now) {
      return incrementFailedAttempt(id, now);
    },
    consume(id, now) {
      return consumeChallenge(id, now);
    },
    async deleteById(id) {
      await getDb()
        .delete(phoneOtpChallenges)
        .where(eq(phoneOtpChallenges.id, id));
    },
  };
}

async function replaceActiveChallenge(
  record: OtpChallengeRecord,
): Promise<"inserted" | "conflict"> {
  try {
    await getDb().execute(replaceActiveChallengeSql(record));
    return "inserted";
  } catch (error) {
    if (isUniqueViolation(error)) {
      return "conflict";
    }
    throw error;
  }
}

async function findLatestActiveChallenge(
  phone: string,
  purpose: OtpPurpose,
  now: Date,
): Promise<OtpChallengeRecord | null> {
  const [row] = await getDb()
    .select()
    .from(phoneOtpChallenges)
    .where(activeChallengeWhere(phone, purpose, now))
    .orderBy(desc(phoneOtpChallenges.createdAt))
    .limit(1);

  return row ?? null;
}

async function incrementFailedAttempt(
  id: string,
  now: Date,
): Promise<"incremented" | "exhausted"> {
  const [row] = await getDb()
    .update(phoneOtpChallenges)
    .set({ attempts: sql`${phoneOtpChallenges.attempts} + 1` })
    .where(
      and(
        eq(phoneOtpChallenges.id, id),
        isNull(phoneOtpChallenges.consumedAt),
        gt(phoneOtpChallenges.expiresAt, now),
        sql`${phoneOtpChallenges.attempts} < ${phoneOtpChallenges.maxAttempts}`,
      ),
    )
    .returning({ id: phoneOtpChallenges.id });

  return row ? "incremented" : "exhausted";
}

async function consumeChallenge(
  id: string,
  now: Date,
): Promise<OtpChallengeRecord | null> {
  const [row] = await getDb()
    .update(phoneOtpChallenges)
    .set({
      consumedAt: now,
      attempts: sql`${phoneOtpChallenges.attempts} + 1`,
    })
    .where(
      and(
        eq(phoneOtpChallenges.id, id),
        isNull(phoneOtpChallenges.consumedAt),
        gt(phoneOtpChallenges.expiresAt, now),
        sql`${phoneOtpChallenges.attempts} < ${phoneOtpChallenges.maxAttempts}`,
      ),
    )
    .returning();

  return row ?? null;
}

function activeChallengeWhere(phone: string, purpose: OtpPurpose, now: Date) {
  return and(
    eq(phoneOtpChallenges.phone, phone),
    eq(phoneOtpChallenges.purpose, purpose),
    isNull(phoneOtpChallenges.consumedAt),
    gt(phoneOtpChallenges.expiresAt, now),
    sql`${phoneOtpChallenges.attempts} < ${phoneOtpChallenges.maxAttempts}`,
  );
}

function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) {
      continue;
    }
    seen.add(current);
    const record = current as { code?: unknown; cause?: unknown };
    if (record.code === "23505") {
      return true;
    }
    if ("cause" in record) {
      queue.push(record.cause);
    }
  }

  return false;
}
