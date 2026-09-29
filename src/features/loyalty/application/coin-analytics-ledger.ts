import "server-only";

import { and, desc, gte, ilike, lte, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { bonusLedger, users } from "@/db/schema";
import type { CoinDailyRow } from "@/features/loyalty/domain/coin-analytics";

const USERS_LIST_LIMIT = 100;

export type CoinAnalyticsTopUser = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  /** Current wallet — unspent coins. */
  balanceAmount: number;
  /** Lifetime net spent (SPEND − SPEND_REVERSAL). */
  spentAmount: number;
  /** Spent + unspent (balance). */
  combinedAmount: number;
};

export type LedgerFlowTotals = {
  grossSpent: number;
  spendReversed: number;
  grossEarned: number;
  earnReversed: number;
};

function toInt(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/** Lifetime SPEND − SPEND_REVERSAL for the outer `users.id` row. */
const lifetimeNetSpentSql = sql<number>`coalesce((
  select sum(case
    when lifetime_spend.entry_type = 'SPEND' then lifetime_spend.amount
    when lifetime_spend.entry_type = 'SPEND_REVERSAL' then -lifetime_spend.amount
    else 0
  end)
  from bonus_ledger as lifetime_spend
  where lifetime_spend.user_id = ${users.id}
), 0)`;

function toWalletUser(input: {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  balanceAmount: number;
  spentAmount: number;
}): CoinAnalyticsTopUser {
  const balanceAmount = Math.max(0, toInt(input.balanceAmount));
  const spentAmount = Math.max(0, toInt(input.spentAmount));
  return {
    userId: input.userId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    balanceAmount,
    spentAmount,
    combinedAmount: balanceAmount + spentAmount,
  };
}

function walletUserSearchFilter(query: string) {
  const pattern = `%${query}%`;
  return or(
    ilike(users.email, pattern),
    ilike(users.firstName, pattern),
    ilike(users.lastName, pattern),
    ilike(users.phone, pattern),
    ilike(sql`concat(${users.firstName}, ' ', ${users.lastName})`, pattern),
    ilike(sql`concat(${users.lastName}, ' ', ${users.firstName})`, pattern),
  );
}

/** Gross ledger entry sums for a UTC window (reversals kept separate). */
export async function queryLedgerFlowTotals(input: {
  start: Date;
  end: Date;
}): Promise<LedgerFlowTotals> {
  const [row] = await getDb()
    .select({
      grossSpent: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'SPEND' then ${bonusLedger.amount} else 0 end), 0)`,
      spendReversed: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'SPEND_REVERSAL' then ${bonusLedger.amount} else 0 end), 0)`,
      grossEarned: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'EARN' then ${bonusLedger.amount} else 0 end), 0)`,
      earnReversed: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'EARN_REVERSAL' then ${bonusLedger.amount} else 0 end), 0)`,
    })
    .from(bonusLedger)
    .where(
      and(
        gte(bonusLedger.createdAt, input.start),
        lte(bonusLedger.createdAt, input.end),
      ),
    );

  return {
    grossSpent: toInt(row?.grossSpent),
    spendReversed: toInt(row?.spendReversed),
    grossEarned: toInt(row?.grossEarned),
    earnReversed: toInt(row?.earnReversed),
  };
}

export async function queryCoinDailyRows(input: {
  start: Date;
  end: Date;
}): Promise<CoinDailyRow[]> {
  const rows = await getDb()
    .select({
      date: sql<string>`to_char(${bonusLedger.createdAt} at time zone 'Asia/Yerevan', 'YYYY-MM-DD')`,
      netSpent: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'SPEND' then ${bonusLedger.amount} when ${bonusLedger.entryType} = 'SPEND_REVERSAL' then -${bonusLedger.amount} else 0 end), 0)`,
      netEarned: sql<number>`coalesce(sum(case when ${bonusLedger.entryType} = 'EARN' then ${bonusLedger.amount} when ${bonusLedger.entryType} = 'EARN_REVERSAL' then -${bonusLedger.amount} else 0 end), 0)`,
    })
    .from(bonusLedger)
    .where(
      and(
        gte(bonusLedger.createdAt, input.start),
        lte(bonusLedger.createdAt, input.end),
      ),
    )
    .groupBy(
      sql`to_char(${bonusLedger.createdAt} at time zone 'Asia/Yerevan', 'YYYY-MM-DD')`,
    )
    .orderBy(
      sql`to_char(${bonusLedger.createdAt} at time zone 'Asia/Yerevan', 'YYYY-MM-DD')`,
    );

  return rows.map((row) => ({
    date: row.date,
    netSpent: Math.max(0, toInt(row.netSpent)),
    netEarned: Math.max(0, toInt(row.netEarned)),
  }));
}

/**
 * Current wallet snapshot per user: balance, lifetime spent, combined.
 * Includes anyone with coins now or who has spent coins before.
 */
export async function queryOutstandingBalances(input?: {
  userQuery?: string;
}): Promise<{
  outstandingBalance: number;
  walletUsers: CoinAnalyticsTopUser[];
}> {
  const userQuery = input?.userQuery?.trim() ?? "";
  const activityFilter = sql`(
    ${users.bonusBalanceAmount} > 0
    or coalesce((
      select sum(case
        when lifetime_spend.entry_type = 'SPEND' then lifetime_spend.amount
        when lifetime_spend.entry_type = 'SPEND_REVERSAL' then -lifetime_spend.amount
        else 0
      end)
      from bonus_ledger as lifetime_spend
      where lifetime_spend.user_id = ${users.id}
    ), 0) > 0
  )`;

  const listWhere = and(
    sql`${users.anonymizedAt} IS NULL`,
    userQuery ? walletUserSearchFilter(userQuery) : activityFilter,
  );

  const [[totals], rows] = await Promise.all([
    getDb()
      .select({
        outstandingBalance: sql<number>`coalesce(sum(${users.bonusBalanceAmount}), 0)`,
      })
      .from(users)
      .where(sql`${users.anonymizedAt} IS NULL`),
    getDb()
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        balanceAmount: users.bonusBalanceAmount,
        spentAmount: lifetimeNetSpentSql,
      })
      .from(users)
      .where(listWhere)
      .orderBy(
        desc(users.bonusBalanceAmount),
        desc(lifetimeNetSpentSql),
      )
      .limit(USERS_LIST_LIMIT),
  ]);

  return {
    outstandingBalance: toInt(totals?.outstandingBalance),
    walletUsers: rows.map((row) =>
      toWalletUser({
        userId: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        balanceAmount: row.balanceAmount,
        spentAmount: row.spentAmount,
      }),
    ),
  };
}
