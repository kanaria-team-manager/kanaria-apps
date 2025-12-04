import type { User } from "@supabase/supabase-js";

export type Bindings = {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

export type Variables = {
  user: User;
};
