import { pgTable, point, text, timestamp } from "drizzle-orm/pg-core";
import { teams } from "./teams";
import { ulid } from "./utils";

export const places = pgTable("places", {
  id: ulid("id").primaryKey(), // varchar(26)
  teamId: ulid("team_id")
    .notNull()
    .references(() => teams.id),
  name: text("name").notNull(),
  description: text("description"),
  location: point("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
