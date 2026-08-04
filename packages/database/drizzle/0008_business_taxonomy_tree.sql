ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_unique";
--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "slug" TYPE varchar(160);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "parent_id" uuid;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "level" varchar(20) DEFAULT 'CATEGORY' NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "categories_parent_active_sort_idx" ON "categories" USING btree ("parent_id","is_active","sort_order");
