CREATE TABLE "labels" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"system_flag" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"label_id" varchar(26) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE no action ON UPDATE no action;