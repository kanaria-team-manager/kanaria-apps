import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

// Cache the database instance
let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

export const createDb = (connectionString: string) => {
  if (!dbInstance) {
    const client = postgres(connectionString);
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
};
