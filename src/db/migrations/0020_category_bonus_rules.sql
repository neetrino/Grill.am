-- LOW risk expand-only: per-category flat AMD bonus rules.
CREATE TABLE IF NOT EXISTS "category_bonus_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"category_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "category_bonus_rules" ADD CONSTRAINT "category_bonus_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "category_bonus_rules" ADD CONSTRAINT "category_bonus_rules_amount_pos_chk" CHECK ("amount" > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "category_bonus_rules" ADD CONSTRAINT "category_bonus_rules_window_chk" CHECK ("starts_at" IS NULL OR "ends_at" IS NULL OR "starts_at" <= "ends_at");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "category_bonus_rules_category_uidx" ON "category_bonus_rules" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_bonus_rules_window_idx" ON "category_bonus_rules" USING btree ("starts_at","ends_at");
