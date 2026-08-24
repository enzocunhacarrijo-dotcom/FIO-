CREATE TABLE IF NOT EXISTS "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"photo_set_hash" text NOT NULL,
	"prompt_version" integer NOT NULL,
	"model" text NOT NULL,
	"result" jsonb NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"cost_usd" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analyses" ADD CONSTRAINT "analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analyses_user_id_idx" ON "analyses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analyses_user_photo_hash_idx" ON "analyses" USING btree ("user_id","photo_set_hash");