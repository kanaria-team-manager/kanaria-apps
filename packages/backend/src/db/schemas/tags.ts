import { pgTable, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { teams } from "./index"
import { SYSTEM_FLAG, ulid } from "./utils";

export const tags = pgTable("tags", {
  id: ulid("id").primaryKey(), // varchar(26)
  teamId: ulid("team_id").references(() => teams.id), // システムフラグが立っている場合はnull
  name: text("name").notNull(),
  color: text("color").notNull(),
  systemFlag: boolean("system_flag")
    .default(SYSTEM_FLAG.CUSTOM)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
