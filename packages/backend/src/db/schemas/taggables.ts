import { relations } from "drizzle-orm";
import { pgEnum, pgTable, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { tags } from "./index";
import { players } from "./players";
import { ulid } from "./utils";

export const taggableType = pgEnum("taggable_type", [
  "event",
  "player",
  "team",
  "user",
]);

export const taggables = pgTable(
  "taggables",
  {
    tagId: ulid("tag_id")
      .notNull()
      .references(() => tags.id),
    taggableType: taggableType("taggable_type").notNull(),
    taggableId: ulid("taggable_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({
      columns: [table.tagId, table.taggableType, table.taggableId],
    }),
  ],
).enableRLS();

export const taggablesRelations = relations(taggables, ({ one }) => ({
  player: one(players, {
    fields: [taggables.taggableId],
    references: [players.id],
  }),
  tag: one(tags, {
    fields: [taggables.tagId],
    references: [tags.id],
  }),
}));
