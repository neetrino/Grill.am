import type { OtpPurpose } from "@/lib/auth/otp/constants";
import type {
  OtpChallengeRecord,
  OtpChallengeRepository,
  OtpUserRecord,
  OtpUserRepository,
} from "@/lib/auth/otp/types";
import { normalizePhoneToE164 } from "@/lib/phone/normalize";

export function createMemoryOtpChallenges(): OtpChallengeRepository & {
  rows: OtpChallengeRecord[];
} {
  const rows: OtpChallengeRecord[] = [];

  return {
    rows,
    async replaceActive(record) {
      for (const row of rows) {
        if (
          row.phone === record.phone &&
          row.purpose === record.purpose &&
          row.consumedAt === null
        ) {
          row.consumedAt = record.createdAt;
        }
      }

      const stillActive = rows.some(
        (row) =>
          row.phone === record.phone &&
          row.purpose === record.purpose &&
          row.consumedAt === null,
      );
      if (stillActive) {
        return "conflict";
      }

      rows.push({ ...record });
      return "inserted";
    },
    async findLatestActive(phone, purpose, now) {
      const match = rows
        .filter(
          (row) =>
            row.phone === phone &&
            row.purpose === purpose &&
            isOpen(row, now),
        )
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
      return match ? { ...match } : null;
    },
    async incrementFailedAttempt(id, now) {
      const row = rows.find((item) => item.id === id);
      if (!row || !isOpen(row, now)) {
        return "exhausted";
      }
      row.attempts += 1;
      return "incremented";
    },
    async consume(id, now) {
      const row = rows.find((item) => item.id === id);
      if (!row || !isOpen(row, now)) {
        return null;
      }
      row.consumedAt = now;
      row.attempts += 1;
      return { ...row };
    },
    async deleteById(id) {
      const index = rows.findIndex((item) => item.id === id);
      if (index >= 0) {
        rows.splice(index, 1);
      }
    },
  };
}

export function createMemoryOtpUsers(
  initial: OtpUserRecord[] = [],
): OtpUserRepository & { users: OtpUserRecord[] } {
  const users = initial.map((user) => ({ ...user }));

  return {
    users,
    async findLoginCandidate(phoneE164) {
      const active = users.filter(
        (user) =>
          user.status === "ACTIVE" &&
          user.phone !== null &&
          normalizePhoneToE164(user.phone) === phoneE164,
      );
      const match = active[0];
      if (active.length === 1 && match) {
        return { kind: "found", user: match };
      }
      if (active.length === 0) {
        return { kind: "none" };
      }
      return { kind: "ambiguous" };
    },
    async findById(id) {
      return users.find((user) => user.id === id) ?? null;
    },
    async applyPhoneChange(userId, update) {
      const user = users.find((item) => item.id === userId);
      if (!user) {
        return;
      }
      user.phone = update.phone;
      user.phoneVerifiedAt = update.phoneVerifiedAt;
    },
    async markPhoneVerified(userId, phoneE164, verifiedAt) {
      const user = users.find((item) => item.id === userId);
      if (!user || user.phone !== phoneE164 || user.status !== "ACTIVE") {
        return "unchanged";
      }
      const taken = users.some(
        (item) =>
          item.id !== userId &&
          item.phone === phoneE164 &&
          item.phoneVerifiedAt !== null,
      );
      if (taken) {
        return "phone_taken";
      }
      user.phoneVerifiedAt = verifiedAt;
      return "verified";
    },
    async touchLastLogin() {
      return undefined;
    },
  };
}

function isOpen(row: OtpChallengeRecord, now: Date): boolean {
  return (
    row.consumedAt === null &&
    row.expiresAt.getTime() > now.getTime() &&
    row.attempts < row.maxAttempts
  );
}

export function activeRows(
  rows: OtpChallengeRecord[],
  purpose: OtpPurpose,
): OtpChallengeRecord[] {
  return rows.filter((row) => row.purpose === purpose && row.consumedAt === null);
}
