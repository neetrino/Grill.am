CREATE TABLE "popups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_assets" DROP CONSTRAINT "media_assets_owner_chk";--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "popup_id" uuid;--> statement-breakpoint
CREATE INDEX "popups_active_created_idx" ON "popups" USING btree ("is_active","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "popups_one_active_uidx" ON "popups" USING btree ("is_active") WHERE "popups"."is_active" = true;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_popup_id_popups_id_fk" FOREIGN KEY ("popup_id") REFERENCES "public"."popups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_assets_popup_idx" ON "media_assets" USING btree ("popup_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_popup_cover_uidx" ON "media_assets" USING btree ("popup_id") WHERE "media_assets"."popup_id" IS NOT NULL AND "media_assets"."role" = 'COVER';--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_chk" CHECK ((
        ("media_assets"."upload_status" = 'PENDING'
          AND "media_assets"."product_id" IS NULL
          AND "media_assets"."category_id" IS NULL
          AND "media_assets"."hero_slide_id" IS NULL
          AND "media_assets"."blog_post_id" IS NULL
          AND "media_assets"."job_posting_id" IS NULL
          AND "media_assets"."popup_id" IS NULL)
        OR ("media_assets"."role" = 'BRANDING' AND "media_assets"."purpose" IS NOT NULL)
        OR (
          ("media_assets"."product_id" IS NOT NULL)::int
          + ("media_assets"."category_id" IS NOT NULL)::int
          + ("media_assets"."hero_slide_id" IS NOT NULL)::int
          + ("media_assets"."blog_post_id" IS NOT NULL)::int
          + ("media_assets"."job_posting_id" IS NOT NULL)::int
          + ("media_assets"."popup_id" IS NOT NULL)::int
        ) = 1
      ));