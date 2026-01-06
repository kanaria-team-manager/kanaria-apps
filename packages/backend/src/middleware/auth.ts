import { createClient } from "@supabase/supabase-js";
import type { Context, Next } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";
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

  // Strategy 1: Local Verification with JWKS (Fast, Asymmetric support)
  // We use Supabase URL to construct the JWKS URL.
  // Strategy 1: Local Verification with JWKS (Fast, Asymmetric support)
  // We use Supabase URL to construct the JWKS URL.
  const supabaseUrl = c.env.SUPABASE_URL;

  if (supabaseUrl) {
    try {
      const jwksUrl = new URL(
        "/auth/v1/.well-known/jwks.json",
        supabaseUrl,
      ).toString();

      const JWKS = createRemoteJWKSet(new URL(jwksUrl));

      const { payload: verifiedPayload } = await jwtVerify(token, JWKS);
      const payload = verifiedPayload as unknown as SupabaseJwtPayload;

      c.set("user", {
        id: payload.sub,
        email: payload.email,
        app_metadata: payload.app_metadata,
        user_metadata: payload.user_metadata,
        role: payload.role,
      });

      return next();
    } catch (err) {
      console.error("JWT Local Verification (JWKS) failed:", err);
      // If validation fails (likely invalid signature or expired), we should probably stop here
      // rather than falling back to remote verification which will likely also fail but slower.
      // However, if the failure is network related (can't fetch JWKS), fallback might work?
      // For now, staying consistent with return Unauthorized.
      return c.json({ error: "Unauthorized" }, 401);
    }
  }

  // Strategy 2: Remote Verification (Fallback, requires only URL/Key, no Secret)
  // This verifies the token against Supabase Auth API
  console.warn(
    "SUPABASE_JWT_SECRET not set. Falling back to Supabase API verification (slower).",
  );

  // We can use the Service Role Key here effectively to act as admin,
  // OR we can create a client with the user's token directly?
  // No, standard patterns is creating client with Url/Key (Anon or Service) and then getUser(token).
  // Ideally use Anon key to be safe, but we have Service Role in types.
  // We'll use createClient(url, anon_key, { global: { headers: { Authorization: ... } } }) pattern

  // HACK: We assume SUPABASE_SERVICE_ROLE_KEY works for general client init,
  // but strictly we should use ANON key for client-side ops simulation.
  // HOWEVER, getUser(token) validates the token regardless of the key used to init the client?
  // Let's use the provided SERVICE_ROLE_KEY but usually it's overkill.
  // Actually, we can just pass the token to getUser.

  if (!supabaseUrl || !c.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase Config Missing");
    return c.json({ error: "Server Configuration Error" }, 500);
  }

  const supabase = createClient(supabaseUrl, c.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data) {
    console.error("Remote Verification failed:", error);
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userData = {
    id: data.claims.sub,
    email: data.claims.email || "",
    app_metadata: data.claims.app_metadata || {},
    user_metadata: data.claims.user_metadata || {},
    role: data.claims.role || "",
  };

  // Map Supabase User to our Context User format
  c.set("user", userData);

  await next();
};
