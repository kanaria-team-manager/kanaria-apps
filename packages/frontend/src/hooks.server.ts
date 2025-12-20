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
    const { data, error } = await event.locals.supabase.auth.getClaims();
    if (error || !data) {
      return { session: null, claims: null };
    }

    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();

    // Warn: session.user comes from cookie and might be insecure.
    // We already have a validated user from getUser().
    // Remove user from session to avoid Supabase warning "Using the user object...".
    if (session) {
      // @ts-expect-error Deleting readonly property
      delete session.user;
    }

    return { session, claims: data.claims };
  };

  const { session } = await event.locals.safeGetSession();
  const path = event.url.pathname;

  // Logic:
  // 1. If user is logged in and visits public route -> redirect to dashboard
  // 2. If user is NOT logged in and visits private route -> redirect to login

  const isPublicKeyRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
  const isPrivateKeyRoute = privateRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );

  if (session && isPublicKeyRoute) {
    throw redirect(303, "/dashboard");
  }

  if (!session && isPrivateKeyRoute) {
    throw redirect(303, "/auth/login");
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range" || name === "x-supabase-api-version";
    },
  });
};

// Route protection logic
const publicRoutes = [
  "/auth/login",
  "/auth/activate",
  "/auth/signup",
  "/auth/verify-email",
  "/team/create",
];

const privateRoutes = ["/dashboard", "/players"];
