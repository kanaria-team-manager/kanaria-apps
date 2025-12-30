ALTER TABLE "events" DROP CONSTRAINT "events_team_id_local_sequence_unique";--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "event_sequence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "local_sequence";--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_team_id_event_no_unique" UNIQUE("team_id","event_no");