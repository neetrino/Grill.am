-- LOW risk expand-only: per-product flat AMD bonus rules (independent of earn %).
CREATE TABLE IF NOT EXISTS "product_bonus_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "product_bonus_rules" ADD CONSTRAINT "product_bonus_rules_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "product_bonus_rules" ADD CONSTRAINT "product_bonus_rules_amount_pos_chk" CHECK ("amount" > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "product_bonus_rules" ADD CONSTRAINT "product_bonus_rules_window_chk" CHECK ("starts_at" IS NULL OR "ends_at" IS NULL OR "starts_at" <= "ends_at");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_bonus_rules_product_uidx" ON "product_bonus_rules" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_bonus_rules_window_idx" ON "product_bonus_rules" USING btree ("starts_at","ends_at");
