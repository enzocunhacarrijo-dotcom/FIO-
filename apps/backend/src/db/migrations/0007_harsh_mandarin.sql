CREATE TABLE IF NOT EXISTS "oauth_login_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_login_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "registered_has_credentials";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_sub" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_login_codes" ADD CONSTRAINT "oauth_login_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_login_codes_user_id_idx" ON "oauth_login_codes" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "registered_has_credentials" CHECK ("users"."kind" <> 'registered' OR ("users"."email" IS NOT NULL AND ("users"."password_hash" IS NOT NULL OR "users"."google_sub" IS NOT NULL)));