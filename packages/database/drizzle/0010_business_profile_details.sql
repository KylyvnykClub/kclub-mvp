ALTER TABLE "business_profiles" ADD COLUMN "public_phone" varchar(32);
ALTER TABLE "business_profiles" ADD COLUMN "public_email" varchar(255);
ALTER TABLE "business_profiles" ADD COLUMN "address" text;
ALTER TABLE "business_profiles" ADD COLUMN "working_hours" text;
ALTER TABLE "business_profiles" ADD COLUMN "founded_year" smallint;
ALTER TABLE "business_profiles" ADD COLUMN "team_size" varchar(50);
