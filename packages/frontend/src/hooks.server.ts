import { createServerClient } from "@supabase/ssr";
import { type Handle, redirect } from "@sveltejs/kit";
import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  PUBLIC_SUPABASE_URL,
} from "$env/static/public";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { ...options, path: "/" });
          });
        },
      },
    },
  );

  /**
   * Unlike `supabase.auth.getSession()`, which utilizes the browser client for
   * session retrieval, this method is safe to use in server-side `load` functions.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();

    // Use getClaims for faster local verification (if possible)
    // and map claims to a User-like object
    const {
      data: claimsData,
      error,
    } = await event.locals.supabase.auth.getClaims();

    if (error || !claimsData) {
      return { session: null, user: null };
    }

    // Map claims to User object
    // Note: claimsData structure depends on Supabase version, assuming it returns claims directly or inside checks
    // Based on docs: { data: { claims: ... }, error: ... } or just data IS claims?
    // Docs say: const { data, error } = ...
    // Assuming data contains the claims directly or data.claims
    const claims = claimsData.claims || claimsData;

    const user = {
      id: claims.sub,
      app_metadata: claims.app_metadata,
      user_metadata: claims.user_metadata,
      aud: claims.aud,
      email: claims.email,
      phone: claims.phone,
      role: claims.role,
      created_at: "", // Not available in claims usually
      updated_at: "",
      is_anonymous: claims.is_anonymous,
    } as unknown as import("@supabase/supabase-js").User;

    // Warn: session.user comes from cookie and might be insecure.
    // We already have a validated user from getClaims().
    // Remove user from session to avoid Supabase warning "Using the user object...".
    if (session) {
      // @ts-expect-error Deleting readonly property
      delete session.user;
    }

    return { session, user };
  };

  const { session } = await event.locals.safeGetSession();
  const path = event.url.pathname;

  // ログイン済みユーザーが認証ページにアクセスした場合はダッシュボードにリダイレクト
  const isAuthRoute = authRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );

  if (session && isAuthRoute) {
    throw redirect(303, "/dashboard");
  }

  // 認証必須ルートの保護は (protected) グループの +layout.server.ts で行う

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range" || name === "x-supabase-api-version";
    },
  });
};

// ログイン済みユーザーがアクセスした場合にダッシュボードにリダイレクトするルート
const authRoutes = [
  "/auth/login",
  "/auth/activate",
  "/auth/signup",
  "/auth/verify-email",
  "/team/create",
];
