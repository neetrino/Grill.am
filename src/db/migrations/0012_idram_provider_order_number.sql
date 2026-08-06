-- Phase 4: iDram EDP_BILL_NO as first-class provider order number.
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider_order_number" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_order_number_uidx"
  ON "payments" ("provider", "provider_order_number")
  WHERE "provider_order_number" IS NOT NULL AND "provider_order_number" <> '';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_provider_order_number_idx"
  ON "payments" ("provider_order_number");
