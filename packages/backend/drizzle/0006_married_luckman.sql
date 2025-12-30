CREATE TABLE "places" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"team_id" varchar(26) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"location" "point",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "places" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "place_id" varchar(26);--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;