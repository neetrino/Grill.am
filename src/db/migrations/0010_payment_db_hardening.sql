-- Phase 2 payment DB hardening
-- Pre-migration audit (dev): no duplicate attempts/refs; all payments PENDING.
-- Timestamp backfill skipped: no CAPTURED/FAILED/CANCELLED rows to approximate.
-- Guest tokens are not backfilled for historical orders (remain inaccessible without regeneration).

-- Normalize empty provider references before unique index.
UPDATE "payments"
SET "provider_reference" = NULL
WHERE "provider_reference" IS NOT NULL AND btrim("provider_reference") = '';--> statement-breakpoint

DROP INDEX IF EXISTS "payments_order_attempt_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "order_events_provider_event_uidx";--> statement-breakpoint

ALTER TABLE "order_events" ADD COLUMN IF NOT EXISTS "provider" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source_cart_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guest_access_token_hash" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guest_access_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "authorized_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "captured_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "failed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "refunded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_source_cart_id_carts_id_fk'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_source_cart_id_carts_id_fk"
      FOREIGN KEY ("source_cart_id") REFERENCES "public"."carts"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "orders_source_cart_idx" ON "orders" USING btree ("source_cart_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_guest_access_hash_uidx" ON "orders" USING btree ("guest_access_token_hash") WHERE "orders"."guest_access_token_hash" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_order_attempt_uidx" ON "payments" USING btree ("order_id","attempt_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_ref_uidx" ON "payments" USING btree ("provider","provider_reference") WHERE "payments"."provider_reference" IS NOT NULL AND "payments"."provider_reference" <> '';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_one_captured_per_order_uidx" ON "payments" USING btree ("order_id") WHERE "payments"."status" = 'CAPTURED';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "order_events_provider_event_uidx" ON "order_events" USING btree ("provider","provider_event_id") WHERE "order_events"."provider" IS NOT NULL AND "order_events"."provider_event_id" IS NOT NULL;
