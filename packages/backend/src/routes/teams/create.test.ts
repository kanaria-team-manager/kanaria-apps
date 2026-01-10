import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import createTeam from "./create.js";

// Mock the db module
vi.mock("../../db/index.js", () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

const mockTeamCreate = vi.fn();
const mockUserCreate = vi.fn();

// Mock TeamRepository
vi.mock("../../db/repositories/TeamRepository.js", () => ({
  TeamRepository: class {
    create = mockTeamCreate;
    findByCode = vi.fn();
  },
}));

// Mock UserRepository
vi.mock("../../db/repositories/UserRepository.js", () => ({
  UserRepository: class {
    create = mockUserCreate;
    findBySupabaseId = vi.fn();
    updateStatus = vi.fn();
  },
}));

// Mock Supabase client - must return a proper nested structure
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      admin: {
        getUserById: async (id: string) => ({
          data: {
            user: {
              id,
              email: "test@example.com",
              app_metadata: {},
              user_metadata: {},
            },
          },
          error: null,
        }),
        updateUserById: async () => ({ error: null }),
      },
    },
  }),
}));

describe("POST /teams", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockTeamCreate.mockResolvedValue(undefined);
    mockUserCreate.mockResolvedValue(undefined);
  });

  it("should return 400 if fields are missing", async () => {
    const app = new Hono();

    // Inject mock DB with transaction
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", {
        transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => {
          await callback({});
        }),
      });
      await next();
    });

    app.route("/teams", createTeam);

    const req = new Request("http://localhost/teams/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabaseUserId: "user_123",
        email: "test@example.com",
      }),
    });
    const res = await app.fetch(req, {
      DATABASE_URL: "mock-url",
      SUPABASE_URL: "http://mock.supabase.io",
      SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
      FRONTEND_URL: "http://localhost:5173",
    });

    expect(res.status).toBe(400);
  });

  it("should create team and user successfully", async () => {
    const mockDb = {
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => {
        await callback({});
      }),
    };

    const app = new Hono();

    // Inject mock DB
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      await next();
    });

    app.route("/teams", createTeam);

    const req = new Request("http://localhost/teams/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabaseUserId: "user_123",
        teamName: "Test Team",
        teamCode: "test-code",
        name: "Test User",
        email: "test@example.com",
      }),
    });
    const res = await app.fetch(req, {
      DATABASE_URL: "mock-url",
      SUPABASE_URL: "http://mock.supabase.io",
      SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
      FRONTEND_URL: "http://localhost:5173",
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("message", "Team created successfully");
    expect(mockDb.transaction).toHaveBeenCalled();
    expect(mockTeamCreate).toHaveBeenCalled();
    expect(mockUserCreate).toHaveBeenCalled();
  });
});
