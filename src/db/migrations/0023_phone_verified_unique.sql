-- One verified canonical phone per account.
-- Unverified and null phones stay non-unique so legacy duplicates do not fail deploy.
CREATE UNIQUE INDEX IF NOT EXISTS "users_verified_phone_uidx"
  ON "users" ("phone")
  WHERE "phone_verified_at" IS NOT NULL AND "phone" IS NOT NULL;
