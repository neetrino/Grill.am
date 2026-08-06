-- Phase 5: durable outbox claim/dedupe hardening (LOW–MEDIUM risk).
-- Expand-only: nullable columns + backfill + unique partial index.
-- COMPLETED remains the terminal "sent" status (existing enum).

ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "dedupe_key" text;
--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "claimed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "claimed_by" text;
--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "max_attempts" integer NOT NULL DEFAULT 8;
--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "sent_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "failed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "last_error_code" text;
--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN IF NOT EXISTS "provider_message_id" text;
--> statement-breakpoint

-- Backfill dedupe_key from JSON payload when present.
UPDATE "outbox_events"
SET "dedupe_key" = "payload"->>'dedupeKey'
WHERE "dedupe_key" IS NULL
  AND "payload"->>'dedupeKey' IS NOT NULL
  AND "payload"->>'dedupeKey' <> '';
--> statement-breakpoint

-- Collapse accidental duplicates before unique index (keep earliest row).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY dedupe_key
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM outbox_events
  WHERE dedupe_key IS NOT NULL AND dedupe_key <> ''
)
UPDATE outbox_events AS o
SET
  status = 'FAILED',
  last_error = 'duplicate_dedupe_key_collapsed',
  last_error_code = 'DUPLICATE_DEDUPE_KEY',
  failed_at = COALESCE(failed_at, now()),
  updated_at = now(),
  dedupe_key = NULL
FROM ranked
WHERE o.id = ranked.id
  AND ranked.rn > 1;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "outbox_events_dedupe_key_uidx"
  ON "outbox_events" ("dedupe_key")
  WHERE "dedupe_key" IS NOT NULL AND "dedupe_key" <> '';
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "outbox_events_claim_idx"
  ON "outbox_events" ("status", "available_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "outbox_events_processing_claimed_idx"
  ON "outbox_events" ("status", "claimed_at")
  WHERE "status" = 'PROCESSING';
