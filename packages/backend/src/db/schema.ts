import {
  customType,
  pgTable,
  smallint,
  smallserial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const TEAM_CODE_MAX_LENGTH = 32;
export const TEAM_STATUS = {
  CREATED: 0,
  ACTIVE: 1,
};
export const USER_STATUS = {
  TEMPORARY: 0,
  CONFIRMED: 1,
};

export const ulid = customType<{ data: string }>({
  dataType: () => "varchar(26)",
});

export const teams = pgTable("teams", {
  id: ulid("id").primaryKey(), // varchar(26)
  name: text("name").notNull(),
  code: varchar("code", { length: TEAM_CODE_MAX_LENGTH }).notNull().unique(),
  description: text("description"),
  status: smallint("status").default(TEAM_STATUS.CREATED).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();

export const users = pgTable("users", {
  id: ulid("id").primaryKey(), // varchar(26)
  supabaseUserId: uuid("supabase_user_id").notNull(), // Supabase Auth User ID
  teamId: ulid("team_id")
    .notNull()
    .references(() => teams.id),
  roleId: smallint("role_id")
    .notNull()
    .references(() => roles.id),
  status: smallint("status").default(USER_STATUS.TEMPORARY).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();

export const roles = pgTable("roles", {
  id: smallserial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
