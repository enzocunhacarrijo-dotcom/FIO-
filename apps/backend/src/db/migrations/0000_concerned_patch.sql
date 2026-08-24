CREATE TYPE "public"."objetivo_principal" AS ENUM('qualidade_do_fio', 'densidade_e_queda', 'ambos');--> statement-breakpoint
CREATE TYPE "public"."user_kind" AS ENUM('registered', 'guest');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questionnaire_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"respostas" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "user_kind" NOT NULL,
	"email" text,
	"password_hash" text,
	"device_id" text,
	"objetivo_principal" "objetivo_principal",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_device_id_unique" UNIQUE("device_id"),
	CONSTRAINT "registered_has_credentials" CHECK ("users"."kind" <> 'registered' OR ("users"."email" IS NOT NULL AND "users"."password_hash" IS NOT NULL)),
	CONSTRAINT "guest_has_device_id" CHECK ("users"."kind" <> 'guest' OR "users"."device_id" IS NOT NULL)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questionnaire_responses_user_id_idx" ON "questionnaire_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");