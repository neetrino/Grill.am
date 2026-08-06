import { and, eq, or, sql } from "drizzle-orm";

import { outboxEvents } from "@/db/schema";
import type { DatabaseTransaction } from "@/db/transaction";

export type ClaimedOutboxRow = typeof outboxEvents.$inferSelect;

export type ClaimOutboxBatchInput = {
  workerId: string;
  batchSize: number;
  now?: Date;
  /** PROCESSING rows older than this are reclaimable. */
  leaseTimeoutMs?: number;
};

const DEFAULT_LEASE_MS = 5 * 60_000;

/**
 * Atomically claims a bounded batch with FOR UPDATE SKIP LOCKED.
 * Callers must commit quickly — do not deliver email inside this transaction.
 * Eligibility uses PostgreSQL `now()` so app/DB clock skew cannot starve rows.
 */
export async function claimOutboxBatch(
  tx: DatabaseTransaction,
  input: ClaimOutboxBatchInput,
): Promise<ClaimedOutboxRow[]> {
  const now = input.now ?? new Date();
  const leaseMs = input.leaseTimeoutMs ?? DEFAULT_LEASE_MS;
  const limit = Math.max(1, Math.min(50, input.batchSize));

  const candidates = await tx
    .select()
    .from(outboxEvents)
    .where(
      and(
        sql`${outboxEvents.availableAt} <= now()`,
        or(
          eq(outboxEvents.status, "PENDING"),
          and(
            eq(outboxEvents.status, "PROCESSING"),
            sql`${outboxEvents.claimedAt} <= now() - (${leaseMs} * interval '1 millisecond')`,
          ),
        ),
      ),
    )
    .orderBy(outboxEvents.availableAt)
    .limit(limit)
    .for("update", { skipLocked: true });

  if (candidates.length === 0) {
    return [];
  }

  const claimed: ClaimedOutboxRow[] = [];
  for (const row of candidates) {
    const [updated] = await tx
      .update(outboxEvents)
      .set({
        status: "PROCESSING",
        claimedAt: now,
        claimedBy: input.workerId,
        updatedAt: now,
      })
      .where(
        and(
          eq(outboxEvents.id, row.id),
          or(
            eq(outboxEvents.status, "PENDING"),
            and(
              eq(outboxEvents.status, "PROCESSING"),
              sql`${outboxEvents.claimedAt} <= now() - (${leaseMs} * interval '1 millisecond')`,
            ),
          ),
        ),
      )
      .returning();

    if (updated) {
      claimed.push(updated);
    }
  }

  return claimed;
}

/** Marks a claimed row as successfully delivered (COMPLETED = SENT semantics). */
export async function markOutboxSent(
  tx: DatabaseTransaction,
  input: {
    id: string;
    providerMessageId?: string | null;
    now?: Date;
  },
): Promise<void> {
  const now = input.now ?? new Date();
  await tx
    .update(outboxEvents)
    .set({
      status: "COMPLETED",
      processedAt: now,
      sentAt: now,
      claimedAt: null,
      claimedBy: null,
      providerMessageId: input.providerMessageId ?? null,
      lastError: null,
      lastErrorCode: null,
      updatedAt: now,
    })
    .where(eq(outboxEvents.id, input.id));
}

export async function markOutboxRetry(
  tx: DatabaseTransaction,
  input: {
    id: string;
    attemptCount: number;
    availableAt: Date;
    errorCode: string;
    safeError: string;
    now?: Date;
  },
): Promise<void> {
  const now = input.now ?? new Date();
  await tx
    .update(outboxEvents)
    .set({
      status: "PENDING",
      attemptCount: input.attemptCount,
      availableAt: input.availableAt,
      claimedAt: null,
      claimedBy: null,
      lastError: input.safeError,
      lastErrorCode: input.errorCode,
      updatedAt: now,
    })
    .where(eq(outboxEvents.id, input.id));
}

export async function markOutboxFailed(
  tx: DatabaseTransaction,
  input: {
    id: string;
    attemptCount: number;
    errorCode: string;
    safeError: string;
    now?: Date;
  },
): Promise<void> {
  const now = input.now ?? new Date();
  await tx
    .update(outboxEvents)
    .set({
      status: "FAILED",
      attemptCount: input.attemptCount,
      processedAt: now,
      failedAt: now,
      claimedAt: null,
      claimedBy: null,
      lastError: input.safeError,
      lastErrorCode: input.errorCode,
      updatedAt: now,
    })
    .where(eq(outboxEvents.id, input.id));
}

export async function getOutboxStats(
  tx: DatabaseTransaction,
): Promise<Record<string, number>> {
  const rows = await tx
    .select({
      status: outboxEvents.status,
      count: sql<number>`count(*)::int`,
    })
    .from(outboxEvents)
    .groupBy(outboxEvents.status);

  const stats: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    FAILED: 0,
  };
  for (const row of rows) {
    stats[row.status] = Number(row.count);
  }
  return stats;
}
