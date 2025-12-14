import { pgTable, timestamp } from "drizzle-orm/pg-core";
import { events, players, teams } from "./index";
import { ulid } from "./utils";

export const attendances = pgTable("attendances", {
  id: ulid("id").primaryKey(), // varchar(26)
  teamId: ulid("team_id")
    .notNull()
    .references(() => teams.id),
  eventId: ulid("event_id")
    .notNull()
    .references(() => events.id),
  playerId: ulid("player_id")
    .notNull()
    .references(() => players.id),
  attendanceStatusIds: ulid("attendance_status_ids").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
