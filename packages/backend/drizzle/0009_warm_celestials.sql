ALTER TABLE "players" RENAME COLUMN "name" TO "nick_name";--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "last_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "first_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "image_url" text;