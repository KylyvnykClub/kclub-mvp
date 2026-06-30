CREATE TYPE "public"."business_status" AS ENUM('UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'HIDDEN');--> statement-breakpoint
CREATE TYPE "public"."club_card_status" AS ENUM('ACTIVE', 'REVOKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."introduction_status" AS ENUM('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."member_tier" AS ENUM('MEMBER', 'VIP');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('OWNER', 'ADMIN', 'MODERATOR', 'SUPPORT');--> statement-breakpoint
CREATE TYPE "public"."subscription_kind" AS ENUM('VIP_MEMBERSHIP', 'BUSINESS_PLACEMENT');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'BLOCKED');--> statement-breakpoint
CREATE TABLE "admin_2fa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"secret_ciphertext" text NOT NULL,
	"backup_codes_hashes" json,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_2fa_admin_user_id_unique" UNIQUE("admin_user_id")
);
--> statement-breakpoint
CREATE TABLE "admin_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(120) NOT NULL,
	"value" json NOT NULL,
	"description" text,
	"updated_by_staff_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"session_token_hash" text NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"last_seen_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_session_token_hash_unique" UNIQUE("session_token_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(32) NOT NULL,
	"role" "staff_role" NOT NULL,
	"display_name" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"totp_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_staff_id" uuid,
	"actor_role" "staff_role",
	"action" varchar(120) NOT NULL,
	"entity_type" varchar(120) NOT NULL,
	"entity_id" text NOT NULL,
	"before_data" json,
	"after_data" json,
	"metadata" json,
	"ip_address" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_introductions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"requester_business_id" uuid,
	"target_business_id" uuid NOT NULL,
	"status" "introduction_status" DEFAULT 'SUBMITTED' NOT NULL,
	"client_name" varchar(200) DEFAULT '' NOT NULL,
	"client_contact" varchar(255) DEFAULT '' NOT NULL,
	"message" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" varchar(140) NOT NULL,
	"name" varchar(100) NOT NULL,
	"representative_name" varchar(100) NOT NULL,
	"representative_email" varchar(255) NOT NULL,
	"representative_phone" varchar(32) NOT NULL,
	"country_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"status" "business_status" DEFAULT 'UNDER_REVIEW' NOT NULL,
	"website_url" text,
	"social_url" text,
	"cover_image_url" text,
	"logo_url" text,
	"brief_description" varchar(500),
	"description" text,
	"featured_top" boolean DEFAULT false NOT NULL,
	"featured_recommended" boolean DEFAULT false NOT NULL,
	"member_discount_percent" smallint,
	"internal_notes" text,
	"rejection_reason" text,
	"approved_at" timestamp,
	"published_at" timestamp,
	"hidden_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "business_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"is_high_risk" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code2" char(2) NOT NULL,
	"code3" char(3),
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_code2_unique" UNIQUE("code2"),
	CONSTRAINT "countries_code3_unique" UNIQUE("code3"),
	CONSTRAINT "countries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "member_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_number" varchar(16) NOT NULL,
	"membership_tier" "member_tier" NOT NULL,
	"status" "club_card_status" DEFAULT 'ACTIVE' NOT NULL,
	"qr_payload_url" text,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_cards_card_number_unique" UNIQUE("card_number")
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(120) NOT NULL,
	"handler_status" varchar(32) DEFAULT 'RECEIVED' NOT NULL,
	"livemode" boolean DEFAULT false NOT NULL,
	"payload" json NOT NULL,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"business_profile_id" uuid,
	"kind" "subscription_kind" NOT NULL,
	"status" "subscription_status" DEFAULT 'NONE' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"stripe_price_id" varchar(255),
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supabase_auth_user_id" uuid,
	"phone" varchar(32) NOT NULL,
	"display_name" varchar(100),
	"locale_preference" varchar(2),
	"membership_tier" "member_tier" DEFAULT 'MEMBER' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"terms_accepted_at" timestamp,
	"country" varchar(100),
	"city" varchar(100),
	"about" text,
	"avatar_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_supabase_auth_user_id_unique" UNIQUE("supabase_auth_user_id"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "vip_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'NONE' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"stripe_price_id" varchar(255),
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vip_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "admin_2fa" ADD CONSTRAINT "admin_2fa_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_config" ADD CONSTRAINT "admin_config_updated_by_staff_id_admin_users_id_fk" FOREIGN KEY ("updated_by_staff_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_staff_id_admin_users_id_fk" FOREIGN KEY ("actor_staff_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_introductions" ADD CONSTRAINT "business_introductions_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_introductions" ADD CONSTRAINT "business_introductions_requester_business_id_business_profiles_id_fk" FOREIGN KEY ("requester_business_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_introductions" ADD CONSTRAINT "business_introductions_target_business_id_business_profiles_id_fk" FOREIGN KEY ("target_business_id") REFERENCES "public"."business_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_cards" ADD CONSTRAINT "member_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_business_profile_id_business_profiles_id_fk" FOREIGN KEY ("business_profile_id") REFERENCES "public"."business_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_subscriptions" ADD CONSTRAINT "vip_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_config_key_idx" ON "admin_config" USING btree ("key");--> statement-breakpoint
CREATE INDEX "admin_sess_user_expires_idx" ON "admin_sessions" USING btree ("admin_user_id","expires_at");--> statement-breakpoint
CREATE INDEX "admin_sess_expires_revoked_idx" ON "admin_sessions" USING btree ("expires_at","revoked_at");--> statement-breakpoint
CREATE INDEX "admin_role_active_created_idx" ON "admin_users" USING btree ("role","is_active","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_created_idx" ON "audit_logs" USING btree ("actor_staff_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_entity_created_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_action_created_idx" ON "audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "intro_req_status_created_idx" ON "business_introductions" USING btree ("requester_user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "intro_target_status_created_idx" ON "business_introductions" USING btree ("target_business_id","status","created_at");--> statement-breakpoint
CREATE INDEX "bp_status_created_idx" ON "business_profiles" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "bp_status_featured_cat_idx" ON "business_profiles" USING btree ("status","featured_top","featured_recommended","category_id");--> statement-breakpoint
CREATE INDEX "bp_status_loc_cat_pub_idx" ON "business_profiles" USING btree ("status","country_id","city_id","category_id","published_at");--> statement-breakpoint
CREATE INDEX "categories_risk_active_idx" ON "categories" USING btree ("is_high_risk","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_country_id_slug_idx" ON "cities" USING btree ("country_id","slug");--> statement-breakpoint
CREATE INDEX "cities_country_active_name_idx" ON "cities" USING btree ("country_id","is_active","name");--> statement-breakpoint
CREATE INDEX "countries_active_name_idx" ON "countries" USING btree ("is_active","name");--> statement-breakpoint
CREATE INDEX "member_cards_user_id_issued_at_idx" ON "member_cards" USING btree ("user_id","issued_at");--> statement-breakpoint
CREATE INDEX "member_cards_status_expires_at_idx" ON "member_cards" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "stripe_evt_status_created_idx" ON "stripe_webhook_events" USING btree ("handler_status","created_at");--> statement-breakpoint
CREATE INDEX "stripe_evt_type_created_idx" ON "stripe_webhook_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "subs_user_kind_status_end_idx" ON "subscriptions" USING btree ("user_id","kind","status","current_period_end");--> statement-breakpoint
CREATE INDEX "subs_bp_kind_status_end_idx" ON "subscriptions" USING btree ("business_profile_id","kind","status","current_period_end");--> statement-breakpoint
CREATE INDEX "users_status_created_at_idx" ON "users" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "vip_subs_user_status_end_idx" ON "vip_subscriptions" USING btree ("user_id","status","current_period_end");