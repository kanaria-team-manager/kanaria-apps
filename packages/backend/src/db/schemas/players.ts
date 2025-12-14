import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { ulid } from "./utils";
import { teams, users } from "./index";

export const players = pgTable("players", {
  id: ulid("id").primaryKey(), // varchar(26)
  teamId: ulid("team_id").notNull().references(() => teams.id),
  parentUserId: ulid("parent_user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
