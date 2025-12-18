// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      supabase: import("@supabase/supabase-js").SupabaseClient;
      safeGetSession: () => Promise<{
        session: import("@supabase/supabase-js").Session | null;
        claims: import("@supabase/supabase-js").Claims | null;
      }>;
    }
    interface PageData {
      session: import("@supabase/supabase-js").Session | null;
    }
    // interface Error {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
