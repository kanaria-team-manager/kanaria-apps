import {
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { teams } from "./teams";
import { USER_STATUS } from "./utils";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  supabaseUserId: uuid("supabase_user_id").notNull(), // Supabase Auth User ID
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id),
  roleId: smallint("role_id")
    .notNull()
    .references(() => roles.id),
  status: smallint("status").default(USER_STATUS.TEMPORARY).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
