-- AlterTable
ALTER TABLE "business_introductions" ADD COLUMN "client_name" VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE "business_introductions" ADD COLUMN "client_contact" VARCHAR(255) NOT NULL DEFAULT '';

-- Member-initiated introductions may omit requester business.
ALTER TABLE "business_introductions" ALTER COLUMN "requester_business_id" DROP NOT NULL;
