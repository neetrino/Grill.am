import "server-only";

import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { isVerifiedPhoneOwnershipConflict } from "@/lib/auth/otp/verified-phone-conflict";
import type { OtpUserRecord, OtpUserRepository } from "@/lib/auth/otp/types";
import {
  normalizePhoneToE164,
  phoneLookupCandidates,
  phoneMatchDigits,
} from "@/lib/phone/normalize";

const USER_COLUMNS = {
  id: users.id,
  role: users.role,
  status: users.status,
  phone: users.phone,
  phoneVerifiedAt: users.phoneVerifiedAt,
};

/**
 * User lookups for OTP. Login never inserts a user.
 * SMS login eligibility (verified customer) is applied by the flow, not here,
 * so an ineligible match stays indistinguishable from a missing account.
 */
export function createDrizzleOtpUserRepository(): OtpUserRepository {
  return {
    findLoginCandidate(phoneE164) {
      return findLoginCandidate(phoneE164);
    },
    findById(id) {
      return findUserById(id);
    },
    async applyPhoneChange(userId, update) {
      await getDb()
        .update(users)
        .set({
          phone: update.phone,
          phoneVerifiedAt: update.phoneVerifiedAt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    },
    async markPhoneVerified(userId, phoneE164, verifiedAt) {
      try {
        const [row] = await getDb()
          .update(users)
          .set({ phoneVerifiedAt: verifiedAt, updatedAt: verifiedAt })
          .where(
            and(
              eq(users.id, userId),
              eq(users.phone, phoneE164),
              eq(users.status, "ACTIVE"),
            ),
          )
          .returning({ id: users.id });
        return row ? "verified" : "unchanged";
      } catch (error) {
        if (isVerifiedPhoneOwnershipConflict(error)) {
          return "phone_taken";
        }
        throw error;
      }
    },
    async touchLastLogin(userId, at) {
      await getDb()
        .update(users)
        .set({ lastLoginAt: at, updatedAt: at })
        .where(eq(users.id, userId));
    },
  };
}

async function findUserById(id: string): Promise<OtpUserRecord | null> {
  const [row] = await getDb()
    .select(USER_COLUMNS)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
}

async function findLoginCandidate(
  phoneE164: string,
): Promise<
  | { kind: "none" }
  | { kind: "ambiguous" }
  | { kind: "found"; user: OtpUserRecord }
> {
  const digits = phoneMatchDigits(phoneE164);
  const filters: SQL[] = [inArray(users.phone, phoneLookupCandidates(phoneE164))];
  if (digits.length > 0) {
    filters.push(
      sql`regexp_replace(coalesce(${users.phone}, ''), '[^0-9]', '', 'g') in (${sql.join(
        digits.map((digit) => sql`${digit}`),
        sql`, `,
      )})`,
    );
  }

  const rows = await getDb()
    .select(USER_COLUMNS)
    .from(users)
    .where(or(...filters))
    .limit(20);

  const active = rows.filter(
    (row) =>
      row.status === "ACTIVE" &&
      row.phone !== null &&
      normalizePhoneToE164(row.phone) === phoneE164,
  );
  const match = active[0];
  if (active.length === 1 && rows.length < 20 && match) {
    return { kind: "found", user: match };
  }
  if (active.length === 0) {
    return { kind: "none" };
  }
  return { kind: "ambiguous" };
}
