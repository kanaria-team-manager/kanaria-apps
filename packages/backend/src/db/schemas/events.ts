import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { ulid } from "./utils";

export const events = pgTable("events", {
  id: ulid("id").primaryKey(), // varchar(26)
  teamId: ulid("team_id"), // システムフラグが立っている時は空文字
  title: text("title").notNull(),
  details: text("details"),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
