import { pgTable, timestamp, pgEnum, primaryKey } from "drizzle-orm/pg-core";
import { ulid } from "./utils";
import { tags } from "./index";

export const taggableType = pgEnum("taggable_type", ["event", "player", "team"]);

export const taggables = pgTable("taggables", {
  tagId: ulid("tag_id").notNull().references(() => tags.id),
  taggableType: taggableType("taggable_type").notNull(),
  taggableId: ulid("taggable_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => [
  primaryKey({columns: [table.tagId, table.taggableType, table.taggableId]}),
]).enableRLS();
