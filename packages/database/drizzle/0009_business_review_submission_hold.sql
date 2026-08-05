CREATE TYPE "public"."business_review_submission_status" AS ENUM('PENDING_PAYMENT', 'SUBMITTED', 'FAILED', 'CANCELED');
--> statement-breakpoint
CREATE TABLE "business_review_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "business_profile_id" uuid,
  "status" "business_review_submission_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
  "payload" json NOT NULL,
  "reserve_amount" integer NOT NULL,
  "reserve_currency" varchar(3) NOT NULL,
  "stripe_checkout_session_id" varchar(255),
  "stripe_payment_intent_id" varchar(255),
  "submitted_at" timestamp,
  "failed_at" timestamp,
  "failure_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "business_review_submissions_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id"),
  CONSTRAINT "business_review_submissions_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
ALTER TABLE "business_review_submissions" ADD CONSTRAINT "business_review_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "business_review_submissions" ADD CONSTRAINT "business_review_submissions_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "brs_user_status_created_idx" ON "business_review_submissions" USING btree ("user_id","status","created_at");
--> statement-breakpoint
CREATE INDEX "brs_status_created_idx" ON "business_review_submissions" USING btree ("status","created_at");
