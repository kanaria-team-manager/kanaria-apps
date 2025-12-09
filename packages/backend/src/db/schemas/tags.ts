import { pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";
import { labels } from "./labels";
import { LABEL_SYSTEM_FLAG, ulid } from "./utils";

export const tags = pgTable("tags", {
  id: ulid("id").primaryKey(), // varchar(26)
  name: text("name").notNull(),
  labelId: ulid("label_id")
    .notNull()
    .references(() => labels.id),
  systemFlag: smallint("system_flag")
    .default(LABEL_SYSTEM_FLAG.CUSTOM)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
