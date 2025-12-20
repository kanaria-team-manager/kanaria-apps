import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import type { Handle, RequestEvent } from "@sveltejs/kit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handle } from "./hooks.server";

// Mock @supabase/ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

interface MockSupabaseClient {
  auth: {
    getClaims: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
  };
}

describe("hooks.server.ts routing", () => {
  let mockEvent: Partial<RequestEvent>;
  let mockResolve: ReturnType<typeof vi.fn>;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getClaims: vi
          .fn()
          .mockResolvedValue({ data: { claims: {} }, error: null }),
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: null }, error: null }),
      },
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

    mockEvent = {
      url: new URL("http://localhost"),
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      } as any,
      locals: {
        safeGetSession: vi.fn().mockResolvedValue({ session: null }),
      } as any,
    };
    mockResolve = vi.fn().mockResolvedValue(new Response("ok"));
  });

  const updateMockSupabase = (session: Session | null) => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session },
      error: null,
    });
    // Ensure getClaims returns success so safeGetSession continues to getSession
    mockSupabase.auth.getClaims.mockResolvedValue({
      data: { claims: {} },
      error: null,
    });
  };

  const invokeHandle = async (path: string, session: Session | null = null) => {
    if (mockEvent.url) mockEvent.url.pathname = path;
    updateMockSupabase(session);
    await handle({
      event: mockEvent as RequestEvent,
      resolve: mockResolve as any,
    });
  };

  const catchRedirect = async (
    path: string,
    session: Session | null = null,
  ) => {
    if (mockEvent.url) mockEvent.url.pathname = path;
    updateMockSupabase(session);

    try {
      await handle({
        event: mockEvent as RequestEvent,
        resolve: mockResolve as any,
      });
      return null;
    } catch (e: unknown) {
      return e;
    }
  };

  describe("Logged Out State", () => {
    it("should allow access to public routes", async () => {
      const publicRoutes = [
        "/auth/login",
        "/auth/activate",
        "/auth/signup",
        "/auth/verify-email",
        "/team/create",
      ];

      for (const route of publicRoutes) {
        const error = await catchRedirect(route, null);
        expect(error, `Should not redirect for ${route}`).toBeNull();
        expect(mockResolve).toHaveBeenCalled();
        mockResolve.mockClear();
      }
    });

    it("should redirect private routes to /auth/login", async () => {
      const privateRoutes = ["/dashboard", "/players"];

      for (const route of privateRoutes) {
        const error = await catchRedirect(route, null);
        expect(error).not.toBeNull();
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          "location" in error
        ) {
          expect(error.status).toBe(303);
          expect(error.location).toBe("/auth/login");
        }
      }
    });
  });

  describe("Logged In State", () => {
    const mockSession: Session = {
      user: {
        id: "user-1",
        aud: "authenticated",
        email: "test@example.com",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      },
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      expires_at: Date.now() / 1000 + 3600,
    };

    it("should allow access to private routes", async () => {
      const privateRoutes = ["/dashboard", "/players"];

      for (const route of privateRoutes) {
        const error = await catchRedirect(route, mockSession);
        expect(error, `Should not redirect for ${route}`).toBeNull();
        expect(mockResolve).toHaveBeenCalled();
        mockResolve.mockClear();
      }
    });

    it("should redirect public routes to /dashboard", async () => {
      const publicRoutes = [
        "/auth/login",
        "/auth/activate",
        "/auth/signup",
        "/auth/verify-email",
        "/team/create",
      ];

      for (const route of publicRoutes) {
        const error = await catchRedirect(route, mockSession);
        expect(error).not.toBeNull();
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          "location" in error
        ) {
          expect(error.status).toBe(303);
          expect(error.location).toBe("/dashboard");
        }
      }
    });
  });
});
