import { pgEnum, pgTable, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { labels } from "./index";
import { ulid } from "./utils";

export const labelableType = pgEnum("labelable_type", [
  "event",
  "player",
  "team",
  "tag",
]);

export const labelables = pgTable(
  "labelables",
  {
    labelId: ulid("label_id")
      .notNull()
      .references(() => labels.id),
    labelableType: labelableType("labelable_type").notNull(),
    labelableId: ulid("labelable_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({
      columns: [table.labelId, table.labelableType, table.labelableId],
    }),
  ],
).enableRLS();
