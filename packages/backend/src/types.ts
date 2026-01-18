import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "./db/schema.js";

export type Bindings = {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  FRONTEND_URL: string;
};

export interface AuthUser {
  id: string;
  email: string;
  app_metadata: {
    teamId?: string;
    roleId?: number;
    provider?: string;
    [key: string]: unknown;
  };
  user_metadata: {
    [key: string]: unknown;
  };
  role: string;
}

export type Variables = {
  user: AuthUser;
  verifiedUser: {
    id: string;
    email: string;
    app_metadata: Record<string, unknown>;
    user_metadata: Record<string, unknown>;
  };
  requestBody: Record<string, unknown>;
  db: PostgresJsDatabase<typeof schema>;
};
