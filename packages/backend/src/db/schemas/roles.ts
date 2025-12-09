import { pgTable, smallserial, text, timestamp } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: smallserial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}).enableRLS();
