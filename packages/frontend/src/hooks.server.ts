import { createServerClient } from "@supabase/ssr";
import type { Handle } from "@sveltejs/kit";
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
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();
    if (error) {
      return { session: null, user: null };
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
    
    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range" || name === "x-supabase-api-version";
    },
  });
};
