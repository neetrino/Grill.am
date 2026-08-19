-- LOW risk: new store_locations table + media_assets owner column (expand-only).
CREATE TABLE "store_locations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"translations" jsonb NOT NULL,
	"phone" text,
	"latitude" double precision,
	"longitude" double precision,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_assets" DROP CONSTRAINT "media_assets_owner_chk";--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "store_location_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "store_locations_slug_uidx" ON "store_locations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "store_locations_active_sort_idx" ON "store_locations" USING btree ("is_active","sort_order");--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_store_location_id_store_locations_id_fk" FOREIGN KEY ("store_location_id") REFERENCES "public"."store_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_assets_store_idx" ON "media_assets" USING btree ("store_location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_store_cover_uidx" ON "media_assets" USING btree ("store_location_id") WHERE "media_assets"."store_location_id" IS NOT NULL AND "media_assets"."role" = 'COVER';--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_chk" CHECK ((
        ("media_assets"."upload_status" = 'PENDING'
          AND "media_assets"."product_id" IS NULL
          AND "media_assets"."category_id" IS NULL
          AND "media_assets"."hero_slide_id" IS NULL
          AND "media_assets"."blog_post_id" IS NULL
          AND "media_assets"."job_posting_id" IS NULL
          AND "media_assets"."popup_id" IS NULL
          AND "media_assets"."store_location_id" IS NULL)
        OR ("media_assets"."role" = 'BRANDING' AND "media_assets"."purpose" IS NOT NULL)
        OR (
          ("media_assets"."product_id" IS NOT NULL)::int
          + ("media_assets"."category_id" IS NOT NULL)::int
          + ("media_assets"."hero_slide_id" IS NOT NULL)::int
          + ("media_assets"."blog_post_id" IS NOT NULL)::int
          + ("media_assets"."job_posting_id" IS NOT NULL)::int
          + ("media_assets"."popup_id" IS NOT NULL)::int
          + ("media_assets"."store_location_id" IS NOT NULL)::int
        ) = 1
      ));
--> statement-breakpoint
INSERT INTO "store_locations" ("id", "slug", "translations", "latitude", "longitude", "sort_order", "is_active")
VALUES
  (
    '01900000-0000-7000-8000-000000000080',
    'khorenatsi-95-2',
    '{"hy": {"title": "Խորենացի", "address": "Խորենացի 95/2"}, "en": {"title": "Khorenatsi", "address": "Khorenatsi 95/2"}, "ru": {"title": "Хоренаци", "address": "Хоренаци 95/2"}}'::jsonb,
    40.1650047,
    44.5157429,
    0,
    true
  ),
  (
    '01900000-0000-7000-8000-000000000081',
    'khorenatsi-88',
    '{"hy": {"title": "Խորենացի", "address": "Խորենացի 88"}, "en": {"title": "Khorenatsi", "address": "Khorenatsi 88"}, "ru": {"title": "Хоренаци", "address": "Хоренаци 88"}}'::jsonb,
    40.16504396916831,
    44.51524888164161,
    1,
    true
  ),
  (
    '01900000-0000-7000-8000-000000000082',
    'pushkin-43-3',
    '{"hy": {"title": "Պուշկին", "address": "Պուշկին 43/3"}, "en": {"title": "Pushkin", "address": "Pushkin 43/3"}, "ru": {"title": "Пушкин", "address": "Пушкин 43/3"}}'::jsonb,
    40.18513214380965,
    44.509024815622446,
    2,
    true
  ),
  (
    '01900000-0000-7000-8000-000000000083',
    'totovents-2-7',
    '{"hy": {"title": "Թոթովենց", "address": "Թոթովենց 2/7"}, "en": {"title": "Totovents", "address": "Totovents 2/7"}, "ru": {"title": "Тотовенц", "address": "Тотовенц 2/7"}}'::jsonb,
    40.20162759451002,
    44.56806828266752,
    3,
    true
  ),
  (
    '01900000-0000-7000-8000-000000000084',
    'baghramyan-50-5',
    '{"hy": {"title": "Բաղրամյան", "address": "Բաղրամյան 50/5"}, "en": {"title": "Baghramyan", "address": "Baghramyan 50/5"}, "ru": {"title": "Баграмян", "address": "Баграмян 50/5"}}'::jsonb,
    40.19244704040017,
    44.502048389975556,
    4,
    true
  ),
  (
    '01900000-0000-7000-8000-000000000085',
    'isakov-27',
    '{"hy": {"title": "Ծովակալ Իսակովի", "address": "Ծովակալ Իսակովի 27"}, "en": {"title": "Admiral Isakov", "address": "Admiral Isakov 27"}, "ru": {"title": "Адмирала Исакова", "address": "Адмирала Исакова 27"}}'::jsonb,
    40.16418895562438,
    44.41802551037388,
    5,
    true
  ),
  (
    '01900000-0000-7000-8000-000000000086',
    'andranik-94-4',
    '{"hy": {"title": "Անդրանիկի", "address": "Անդրանիկի 94/4"}, "en": {"title": "Andranik", "address": "Andranik 94/4"}, "ru": {"title": "Андраника", "address": "Андраника 94/4"}}'::jsonb,
    40.17072218226695,
    44.44593255407077,
    6,
    true
  ),
  (
    '01900000-0000-7000-8000-000000000087',
    'sebastia-16-1',
    '{"hy": {"title": "Սեբաստիա", "address": "Սեբաստիա 16/1"}, "en": {"title": "Sebastia", "address": "Sebastia 16/1"}, "ru": {"title": "Себастия", "address": "Себастия 16/1"}}'::jsonb,
    40.185160941144254,
    44.46107630616896,
    7,
    true
  ),
  (
    '01900000-0000-7000-8000-000000000088',
    'tigran-petrosyan-13-8',
    '{"hy": {"title": "Տիգրան Պետրոսյան", "address": "Տիգրան Պետրոսյան 13/8"}, "en": {"title": "Tigran Petrosyan", "address": "Tigran Petrosyan 13/8"}, "ru": {"title": "Тигран Петросян", "address": "Тигран Петросян 13/8"}}'::jsonb,
    40.2215195,
    44.4950089,
    8,
    true
  )
ON CONFLICT ("slug") DO NOTHING;
