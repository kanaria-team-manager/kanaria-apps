import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { teams, users } from "./index";
import { places } from "./places";
import { ulid } from "./utils";

export const events = pgTable(
  "events",
  {
    id: ulid("id").primaryKey(), // varchar(26)
    ownerId: ulid("owner_id")
      .notNull()
      .references(() => users.id),
    teamId: ulid("team_id")
      .notNull()
      .references(() => teams.id),
    placeId: ulid("place_id").references(() => places.id),
    title: text("title").notNull(),
    details: text("details"),
    startDateTime: timestamp("start_date_time").notNull(),
    endDateTime: timestamp("end_date_time").notNull(),
    eventNo: text("event_no").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [unique().on(t.teamId, t.eventNo)],
).enableRLS();
