import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { teams } from "./index";
import { ulid } from "./utils";

export const events = pgTable(
  "events",
  {
    id: ulid("id").primaryKey(), // varchar(26)
    teamId: ulid("team_id")
      .notNull()
      .references(() => teams.id),
    title: text("title").notNull(),
    details: text("details"),
    startDateTime: timestamp("start_date_time").notNull(),
    endDateTime: timestamp("end_date_time").notNull(),
    eventNo: text("event_no").notNull().unique(),
    localSequence: integer("local_sequence").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.teamId, t.localSequence),
  }),
).enableRLS();
