import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teams } from "./index";
import { SYSTEM_FLAG, ulid } from "./utils";

export const labels = pgTable("labels", {
  id: ulid("id").primaryKey(), // varchar(26)
  name: text("name").notNull(),
  teamId: ulid("team_id").references(() => teams.id), // システムフラグが立っている時はnull
  color: text("color").notNull().default("#000000"),
  type: text("type").notNull().default("event"),
  systemFlag: boolean("system_flag").default(SYSTEM_FLAG.CUSTOM).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
