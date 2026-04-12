import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { events, players, teams } from "./index";

export const attendances = pgTable("attendances", {
  id: uuid("id").primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  attendanceStatusIds: uuid("attendance_status_ids").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
