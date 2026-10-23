-- Email and password are optional credentials.
-- Existing SMS-signup placeholders are not real inboxes and are not usable passwords.
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

UPDATE "users"
SET
  "email" = NULL,
  "password_hash" = NULL
WHERE "email" ~* '^sms\.[0-9]+@phone\.local$';
