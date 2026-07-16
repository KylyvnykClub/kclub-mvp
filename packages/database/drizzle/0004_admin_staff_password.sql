ALTER TABLE "admin_users" ADD COLUMN "password_hash" text;
ALTER TABLE "admin_users" ADD COLUMN "password_set_at" timestamp;
