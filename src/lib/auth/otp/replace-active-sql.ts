import { sql, type SQL } from "drizzle-orm";

import type { OtpChallengeRecord } from "@/lib/auth/otp/types";

/**
 * One PostgreSQL statement: consume the previous active challenge, then insert
 * the new one. The INSERT reads `consumed` so the UPDATE runs first and the
 * partial unique index sees those rows as consumed. The whole statement rolls
 * back together, including when the insert hits `phone_otp_challenges_one_active_uidx`.
 */
export function replaceActiveChallengeSql(record: OtpChallengeRecord): SQL {
  return sql`
    WITH consumed AS (
      UPDATE phone_otp_challenges
      SET consumed_at = ${record.createdAt}
      WHERE phone = ${record.phone}
        AND purpose = CAST(${record.purpose} AS phone_otp_purpose)
        AND consumed_at IS NULL
      RETURNING id
    )
    INSERT INTO phone_otp_challenges (
      id,
      phone,
      user_id,
      purpose,
      code_hash,
      expires_at,
      attempts,
      max_attempts,
      consumed_at,
      created_at
    )
    SELECT
      CAST(${record.id} AS uuid),
      ${record.phone},
      CAST(${record.userId} AS uuid),
      CAST(${record.purpose} AS phone_otp_purpose),
      ${record.codeHash},
      CAST(${record.expiresAt} AS timestamptz),
      ${record.attempts},
      ${record.maxAttempts},
      CAST(${record.consumedAt} AS timestamptz),
      CAST(${record.createdAt} AS timestamptz)
    FROM (SELECT count(*) AS updated_count FROM consumed) AS consumed_gate
    WHERE consumed_gate.updated_count >= 0
  `;
}
