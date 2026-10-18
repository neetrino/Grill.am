import "server-only";

import { randomBytes } from "node:crypto";

import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { isVerifiedPhoneOwnershipConflict } from "@/lib/auth/otp/verified-phone-conflict";
import { smsPlaceholderEmail } from "@/lib/auth/otp/sms-placeholder-user";
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
 * User lookups and SMS-signup inserts for OTP.
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
    async createVerifiedPhoneCustomer(input) {
      const passwordHash = await hashPassword(
        randomBytes(32).toString("base64url"),
      );
      try {
        const [row] = await getDb()
          .insert(users)
          .values({
            id: input.id,
            email: smsPlaceholderEmail(input.phoneE164),
            passwordHash,
            passwordUpdatedAt: input.now,
            firstName: "",
            lastName: "",
            phone: input.phoneE164,
            phoneVerifiedAt: input.now,
            role: "CUSTOMER",
            status: "ACTIVE",
            termsAcceptedAt: input.now,
            termsVersion: "1.0",
            lastLoginAt: input.now,
            createdAt: input.now,
            updatedAt: input.now,
          })
          .returning(USER_COLUMNS);
        if (!row) {
          return { kind: "phone_taken" };
        }
        return { kind: "created", user: row };
      } catch (error) {
        if (isVerifiedPhoneOwnershipConflict(error)) {
          return { kind: "phone_taken" };
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
  | { kind: "held" }
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

  const canonical = rows.filter(
    (row) =>
      row.phone !== null &&
      row.status !== "ANONYMIZED" &&
      normalizePhoneToE164(row.phone) === phoneE164,
  );
  const active = canonical.filter((row) => row.status === "ACTIVE");
  const match = active[0];
  if (active.length === 1 && rows.length < 20 && match) {
    return { kind: "found", user: match };
  }
  if (active.length > 1) {
    return { kind: "ambiguous" };
  }
  if (canonical.length > 0) {
    return { kind: "held" };
  }
  return { kind: "none" };
}
