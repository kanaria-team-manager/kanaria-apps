import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "./db/schema.js";

export type Bindings = {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  FRONTEND_URL: string;
};

export type Variables = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any; // Using any or specific JWT payload type
  db: PostgresJsDatabase<typeof schema>;
};
