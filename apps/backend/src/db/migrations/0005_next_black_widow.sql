CREATE TYPE "public"."habit_source" AS ENUM('manual', 'healthkit', 'whoop', 'oura', 'garmin');--> statement-breakpoint
CREATE TYPE "public"."stress_level" AS ENUM('baixo', 'medio', 'alto');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "habit_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"source" "habit_source" DEFAULT 'manual' NOT NULL,
	"sleep_well" boolean,
	"stress_level" "stress_level",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "habit_checkins_user_date_source_unique" UNIQUE("user_id","date","source")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "habit_checkins_user_id_idx" ON "habit_checkins" USING btree ("user_id");