import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

// Environment variables should be loaded from Hono's context in the route handler,
// but for Drizzle Kit or standalone scripts, we might need process.env.
// In Cloudflare Workers, we usually pass the connection string from the environment binding.

// For this setup, we'll export a function to initialize the db with the connection string.
export const createDb = (connectionString: string) => {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
};
