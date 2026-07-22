CREATE TYPE "public"."job_employment_type" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');--> statement-breakpoint
CREATE TYPE "public"."job_posting_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" "job_posting_status" DEFAULT 'DRAFT' NOT NULL,
	"employment_type" "job_employment_type" DEFAULT 'FULL_TIME' NOT NULL,
	"salary_amount" integer,
	"salary_currency" text DEFAULT 'AMD' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"translations" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "media_assets" DROP CONSTRAINT "media_assets_owner_chk";--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "job_posting_id" uuid;--> statement-breakpoint
CREATE INDEX "job_postings_status_sort_idx" ON "job_postings" USING btree ("status","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "job_postings_slug_hy_uidx" ON "job_postings" USING btree (("translations"->'hy'->>'slug')) WHERE "job_postings"."translations"->'hy'->>'slug' IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "job_postings_slug_en_uidx" ON "job_postings" USING btree (("translations"->'en'->>'slug')) WHERE "job_postings"."translations"->'en'->>'slug' IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "job_postings_slug_ru_uidx" ON "job_postings" USING btree (("translations"->'ru'->>'slug')) WHERE "job_postings"."translations"->'ru'->>'slug' IS NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_assets_job_idx" ON "media_assets" USING btree ("job_posting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_job_cover_uidx" ON "media_assets" USING btree ("job_posting_id") WHERE "media_assets"."job_posting_id" IS NOT NULL AND "media_assets"."role" = 'COVER';--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_chk" CHECK ((
        ("media_assets"."upload_status" = 'PENDING'
          AND "media_assets"."product_id" IS NULL
          AND "media_assets"."category_id" IS NULL
          AND "media_assets"."hero_slide_id" IS NULL
          AND "media_assets"."blog_post_id" IS NULL
          AND "media_assets"."job_posting_id" IS NULL)
        OR ("media_assets"."role" = 'BRANDING' AND "media_assets"."purpose" IS NOT NULL)
        OR (
          ("media_assets"."product_id" IS NOT NULL)::int
          + ("media_assets"."category_id" IS NOT NULL)::int
          + ("media_assets"."hero_slide_id" IS NOT NULL)::int
          + ("media_assets"."blog_post_id" IS NOT NULL)::int
          + ("media_assets"."job_posting_id" IS NOT NULL)::int
        ) = 1
      ));