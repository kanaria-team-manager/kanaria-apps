import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import * as dbModule from "../../db/index.js";
import login from "./login.js";

// Mock DB
vi.mock("../../db/index.js");

// Mock Supabase logic (which is inside the route handler usually or middleware)
// But login route will create its own client. We can mock createClient from supabase-js
vi.mock("@supabase/supabase-js", () => {
  const updateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });
  const refreshSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: "refreshed_token", user: {} } },
    error: null,
  });
  const signInWithPassword = vi.fn().mockResolvedValue({
    data: {
      user: { id: "user_123" },
      session: {
        refresh_token: "initial_refresh_token",
        user: { id: "user_123" },
      },
    },
    error: null,
  });

  return {
    createClient: vi.fn(() => ({
      auth: {
        signInWithPassword,
        refreshSession,
        admin: {
          updateUserById,
        },
      },
    })),
  };
});

describe("POST /auth/login", () => {
  it("should login, update metadata, and return refreshed session", async () => {
    // Mock DB response for user lookup
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          teamId: "team_db_123",
          status: 1, // Assuming active/confirmed
        },
      ]),
    };

    // @ts-expect-error Mocking context
    dbModule.createDb.mockReturnValue(mockDb);

    const app = new Hono();
    // Inject Env
    app.use("*", async (c, next) => {
      c.env = {
        SUPABASE_URL: "https://mock.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "mock_key",
      };
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      await next();
    });

    app.route("/auth/login", login);

    const res = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password",
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { session: { access_token: string } };
    expect(data.session.access_token).toBe("refreshed_token");

    // Check if updateUserById was called with teamId from DB
    // Need to access the mock from the factory.
    // Vitest mocks are hoisted, but accessing the inner spy requires importing the mocked module or using check.
    // Since I mocked it inline, retrieving the mock:
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient("url", "key");
    expect(client.auth.admin.updateUserById).toHaveBeenCalledWith("user_123", {
      app_metadata: { teamId: "team_db_123" },
    });
    expect(client.auth.refreshSession).toHaveBeenCalled();
  });
});
