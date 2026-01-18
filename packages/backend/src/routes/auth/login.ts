import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import type { Bindings, Variables } from "../../types.js";

const login = new Hono<{ Bindings: Bindings; Variables: Variables }>();

login.post("/", async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseKey = c.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for admin update

  if (!supabaseUrl || !supabaseKey) {
    return c.json({ error: "Server Configuration Error" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Sign In
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.session || !authData.user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const user = authData.user;
  let session = authData.session;

  // 2. Find Team ID from DB
  const db = c.get("db");
  const userRepo = new UserRepository(db);
  const userRecord = await userRepo.findBySupabaseId(user.id);

  if (userRecord?.teamId) {
    const teamId = userRecord.teamId;
    const roleId = userRecord.roleId;

    // 3. Update User Metadata (app_metadata)
    // Only if it's not already set or different? Supabase updates merge.
    // It's safer to always ensure it's set on login to repair missing claims.
    await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { teamId, roleId },
    });

    // 4. Refresh Session to get new JWT with updated claims
    // We use the refresh token from the initial login
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: session.refresh_token,
      });

    if (!refreshError && refreshData.session) {
      session = refreshData.session;
    } else {
      console.warn(
        "Failed to refresh session after metadata update",
        refreshError,
      );
      // Fallback: return initial session, but claims might be missing until next refresh.
    }
  }

  return c.json({ session });
});

export default login;
