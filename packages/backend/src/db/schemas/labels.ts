import { pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";
import { LABEL_SYSTEM_FLAG, ulid } from "./utils";

export const labels = pgTable("labels", {
  id: ulid("id").primaryKey(), // varchar(26)
  name: text("name").notNull(),
  teamId: ulid("team_id"), // システムフラグが立っている時は空文字
  systemFlag: smallint("system_flag")
    .default(LABEL_SYSTEM_FLAG.CUSTOM)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
