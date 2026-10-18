import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { replaceActiveChallengeSql } from "@/lib/auth/otp/replace-active-sql";
import type { OtpChallengeRecord } from "@/lib/auth/otp/types";

const phone = "+37499123456";
const now = new Date("2026-10-08T12:00:00.000Z");

describe("replace active OTP SQL", () => {
  it("consumes the previous challenge and inserts the next in one parameterized statement", () => {
    const query = new PgDialect().sqlToQuery(replaceActiveChallengeSql(challenge()));

    expect(query.sql).toContain("WITH consumed AS");
    expect(query.sql).toContain("UPDATE phone_otp_challenges");
    expect(query.sql).toContain("INSERT INTO phone_otp_challenges");
    expect(query.sql).toContain("FROM consumed");
    expect(query.sql).not.toContain(";");
    expect(query.sql).not.toContain(phone);
    expect(query.params).toContain(phone);
    expect(query.params).toContain("LOGIN");
  });

  it("binds a null user id instead of interpolating it", () => {
    const query = new PgDialect().sqlToQuery(
      replaceActiveChallengeSql({ ...challenge(), userId: null }),
    );

    expect(query.sql).not.toContain("null");
    expect(query.params).toContain(null);
  });
});

function challenge(): OtpChallengeRecord {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    phone,
    userId: "00000000-0000-4000-8000-000000000002",
    purpose: "LOGIN",
    codeHash: "a".repeat(64),
    expiresAt: new Date(now.getTime() + 60_000),
    attempts: 0,
    maxAttempts: 5,
    consumedAt: null,
    createdAt: now,
  };
}
