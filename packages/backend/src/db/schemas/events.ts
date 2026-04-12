import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { labels, teams, users } from "./index";
import { places } from "./places";

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    placeId: uuid("place_id").references(() => places.id),
    title: text("title").notNull(),
    details: text("details"),
    startDateTime: timestamp("start_date_time").notNull(),
    endDateTime: timestamp("end_date_time").notNull(),
    eventNo: text("event_no").notNull().unique(),
    labelId: uuid("label_id").references(() => labels.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [unique().on(t.teamId, t.eventNo)],
).enableRLS();
