CREATE TYPE "public"."modifier_kind" AS ENUM('ADDON', 'EXCLUSION');--> statement-breakpoint
CREATE TABLE "modifier_catalog" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" "modifier_kind" NOT NULL,
	"label" jsonb NOT NULL,
	"price_amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "modifier_catalog_price_nonneg_chk" CHECK ("modifier_catalog"."price_amount" >= 0),
	CONSTRAINT "modifier_catalog_exclusion_price_chk" CHECK ("modifier_catalog"."kind" = 'ADDON' OR "modifier_catalog"."price_amount" = 0)
);
--> statement-breakpoint
CREATE INDEX "modifier_catalog_kind_idx" ON "modifier_catalog" USING btree ("kind");--> statement-breakpoint
INSERT INTO "modifier_catalog" ("id", "kind", "label", "price_amount", "created_at", "updated_at")
SELECT DISTINCT ON ((elem->>'id')::uuid)
	(elem->>'id')::uuid,
	'ADDON'::"modifier_kind",
	COALESCE(elem->'label', '{}'::jsonb),
	GREATEST(0, COALESCE((elem->>'priceAmount')::integer, 0)),
	now(),
	now()
FROM "products",
LATERAL jsonb_array_elements(COALESCE("products"."customization"->'addons', '[]'::jsonb)) AS elem
WHERE elem->>'id' IS NOT NULL
	AND (elem->>'id') ~ '^[0-9a-fA-F-]{36}$'
ORDER BY (elem->>'id')::uuid, "products"."updated_at" DESC
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "modifier_catalog" ("id", "kind", "label", "price_amount", "created_at", "updated_at")
SELECT DISTINCT ON ((elem->>'id')::uuid)
	(elem->>'id')::uuid,
	'EXCLUSION'::"modifier_kind",
	COALESCE(elem->'label', '{}'::jsonb),
	0,
	now(),
	now()
FROM "products",
LATERAL jsonb_array_elements(COALESCE("products"."customization"->'exclusions', '[]'::jsonb)) AS elem
WHERE elem->>'id' IS NOT NULL
	AND (elem->>'id') ~ '^[0-9a-fA-F-]{36}$'
ORDER BY (elem->>'id')::uuid, "products"."updated_at" DESC
ON CONFLICT ("id") DO NOTHING;