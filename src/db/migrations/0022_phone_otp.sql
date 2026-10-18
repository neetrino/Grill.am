-- SMS OTP challenges and phone verification timestamp.
-- Safe for existing users: phone stays nullable and non-unique because legacy
-- rows may be null, duplicated, or stored outside canonical E.164.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users" ("phone");--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."phone_otp_purpose" AS ENUM('LOGIN', 'VERIFY_PHONE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "phone_otp_challenges" (
  "id" uuid PRIMARY KEY NOT NULL,
  "phone" text NOT NULL,
  "user_id" uuid,
  "purpose" "phone_otp_purpose" NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 5 NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "phone_otp_challenges_attempts_nonneg_chk" CHECK ("attempts" >= 0),
  CONSTRAINT "phone_otp_challenges_max_attempts_pos_chk" CHECK ("max_attempts" > 0)
);--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "phone_otp_challenges"
    ADD CONSTRAINT "phone_otp_challenges_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "phone_otp_challenges_phone_purpose_created_idx"
  ON "phone_otp_challenges" ("phone", "purpose", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "phone_otp_challenges_user_idx"
  ON "phone_otp_challenges" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "phone_otp_challenges_one_active_uidx"
  ON "phone_otp_challenges" ("phone", "purpose")
  WHERE "consumed_at" IS NULL;
