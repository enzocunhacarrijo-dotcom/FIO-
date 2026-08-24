CREATE TYPE "public"."photo_kind" AS ENUM('comprimento', 'raiz', 'pontas');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "photo_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "photos_user_id_kind_idx" ON "photos" USING btree ("user_id","kind");