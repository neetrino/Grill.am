CREATE TYPE "public"."job_application_status" AS ENUM('UNREAD', 'READ', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"job_posting_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"message" text NOT NULL,
	"status" "job_application_status" DEFAULT 'UNREAD' NOT NULL,
	"cv_object_key" text NOT NULL,
	"cv_file_name" text NOT NULL,
	"cv_mime_type" text NOT NULL,
	"cv_byte_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_applications_cv_byte_size_chk" CHECK ("job_applications"."cv_byte_size" >= 0)
);
--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_applications_status_created_idx" ON "job_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "job_applications_job_posting_idx" ON "job_applications" USING btree ("job_posting_id");