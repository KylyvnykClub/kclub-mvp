CREATE TYPE "public"."business_verification_document_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "business_verification_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_profile_id" uuid NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"reviewed_by_staff_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"storage_path" text NOT NULL,
	"public_url" text NOT NULL,
	"status" "business_verification_document_status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "business_verification_documents" ADD CONSTRAINT "business_verification_documents_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_verification_documents" ADD CONSTRAINT "business_verification_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_verification_documents" ADD CONSTRAINT "business_verification_documents_reviewed_by_staff_id_admin_users_id_fk" FOREIGN KEY ("reviewed_by_staff_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bvd_business_status_created_idx" ON "business_verification_documents" USING btree ("business_profile_id","status","created_at");--> statement-breakpoint
CREATE INDEX "bvd_uploaded_by_created_idx" ON "business_verification_documents" USING btree ("uploaded_by_user_id","created_at");--> statement-breakpoint
