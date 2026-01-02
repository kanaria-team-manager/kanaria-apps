import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teams, users } from "./index";
import { taggables } from "./taggables";
import { ulid } from "./utils";

export const players = pgTable("players", {
  id: ulid("id").primaryKey(), // varchar(26)
  teamId: ulid("team_id")
    .notNull()
    .references(() => teams.id),
  parentUserId: ulid("parent_user_id")
    .notNull()
    .references(() => users.id),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  nickName: text("nick_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();

export const playersRelations = relations(players, ({ many }) => ({
  taggables: many(taggables),
}));
