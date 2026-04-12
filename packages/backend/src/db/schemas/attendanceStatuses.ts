import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { teams } from "./index";
import { SYSTEM_FLAG } from "./utils";

export const attendanceStatuses = pgTable("attendance_statuses", {
  id: uuid("id").primaryKey(),
  teamId: uuid("team_id").references(() => teams.id), // systemフラグが立っている場合はnull
  name: text("name").notNull(),
  color: text("color").notNull(),
  systemFlag: boolean("system_flag").default(SYSTEM_FLAG.CUSTOM).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
