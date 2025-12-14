// import { createClient } from "@supabase/supabase-js";
import { type Context, type Next } from "hono";
import { verify } from "hono/jwt";
import type { Bindings, Variables } from "../types.js";

// Supabase JWT Payload Type
interface SupabaseJwtPayload {
  sub: string;
  email: string;
  app_metadata: {
    teamId?: string;
    provider?: string;
    [key: string]: unknown;
  };
  user_metadata: {
    [key: string]: unknown;
  };
  role: string;
  exp: number;
}

export const authMiddleware = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  // const supabaseUrl = c.env.SUPABASE_URL; // Unused for local verify
  const jwtSecret = c.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    console.error("Supabase JWT Secret missing");
    return c.json({ error: "Internal Server Error" }, 500);
  }

  try {
    const payload = (await verify(token, jwtSecret)) as unknown as SupabaseJwtPayload;

    // Attach user payload to context
    // We map it to satisfy common usage, or cast as Needed
    c.set("user", {
      id: payload.sub,
      email: payload.email,
      app_metadata: payload.app_metadata,
      user_metadata: payload.user_metadata,
      role: payload.role,
      // Add teamId convenience accessor if we extend generic user type?
      // Or just access via user.app_metadata.teamId
    });

    await next();
  } catch (err) {
    console.error("JWT Verification failed:", err);
    return c.json({ error: "Unauthorized" }, 401);
  }
};
