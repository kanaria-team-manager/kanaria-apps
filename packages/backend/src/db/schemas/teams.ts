import {
  pgTable,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { TEAM_CODE_MAX_LENGTH, TEAM_STATUS, ulid } from "./utils";

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
