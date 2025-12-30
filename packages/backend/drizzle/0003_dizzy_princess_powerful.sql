ALTER TABLE "events" ADD COLUMN "event_no" text NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "local_sequence" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_event_no_unique" UNIQUE("event_no");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_team_id_local_sequence_unique" UNIQUE("team_id","local_sequence");