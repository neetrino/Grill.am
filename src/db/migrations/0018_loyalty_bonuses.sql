-- LOW risk expand-only: loyalty bonuses (settings via store_settings, wallet + ledger).
CREATE TYPE "public"."bonus_ledger_entry_type" AS ENUM('EARN', 'SPEND', 'SPEND_REVERSAL', 'EARN_REVERSAL');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bonus_balance_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "bonus_spent_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "bonus_earned_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "bonus_earned_applied_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_bonus_balance_nonneg_chk" CHECK ("bonus_balance_amount" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bonus_ledger" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"entry_type" "bonus_ledger_entry_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "bonus_ledger" ADD CONSTRAINT "bonus_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "bonus_ledger" ADD CONSTRAINT "bonus_ledger_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "bonus_ledger" ADD CONSTRAINT "bonus_ledger_amount_pos_chk" CHECK ("amount" > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "bonus_ledger" ADD CONSTRAINT "bonus_ledger_balance_after_nonneg_chk" CHECK ("balance_after" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bonus_ledger_user_created_idx" ON "bonus_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bonus_ledger_order_idx" ON "bonus_ledger" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bonus_ledger_order_earn_uidx" ON "bonus_ledger" USING btree ("order_id") WHERE "entry_type" = 'EARN' AND "order_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bonus_ledger_order_spend_uidx" ON "bonus_ledger" USING btree ("order_id") WHERE "entry_type" = 'SPEND' AND "order_id" IS NOT NULL;
