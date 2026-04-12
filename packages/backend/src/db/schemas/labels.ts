import { LABEL_TYPES } from "@kanaria/shared";
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { teams } from "./index";
import { SYSTEM_FLAG } from "./utils";

export const labelTypes = pgEnum("label_type", LABEL_TYPES);

export const labels = pgTable("labels", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  teamId: uuid("team_id").references(() => teams.id), // システムフラグが立っている時はnull
  color: text("color").notNull().default("#000000"),
  type: labelTypes("type").notNull().default("event"),
  systemFlag: boolean("system_flag").default(SYSTEM_FLAG.CUSTOM).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
