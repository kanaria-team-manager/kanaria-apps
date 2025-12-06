ALTER TABLE "users" RENAME COLUMN "user_id" TO "supabase_user_id";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role_id" SET DATA TYPE smallint;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" smallint DEFAULT 0 NOT NULL;