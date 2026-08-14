-- DESTRUCTIVE (approved): remove unused transactional outbox after migrating
-- order emails to immediate Next.js after() delivery.
-- Touches ONLY outbox_events + outbox_status. No commerce tables.

DROP TABLE IF EXISTS "outbox_events";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."outbox_status";
