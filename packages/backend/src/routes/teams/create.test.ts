import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import createTeam from "./create.js";
import { mockDbContext, mockEnv, injectMockDb } from "../../test/test-utils.js";

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

// Mock Supabase client
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

// Mock verify-supabase-user middleware
vi.mock("../../middleware/verify-supabase-user.js", () => ({
  verifySupabaseUser: async (c: any, next: any) => {
    c.set("verifiedUser", {
      id: "user-123",
      email: "test@example.com",
    });
    c.set("requestBody", await c.req.json());
    await next();
  },
}));

describe("POST /teams/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTeamCreate.mockResolvedValue(undefined);
    mockUserCreate.mockResolvedValue(undefined);
  });

  it("should return 400 if required fields are missing", async () => {
    const app = new Hono();
    app.use("*", injectMockDb(mockDbContext()));
    app.route("/teams", createTeam);

    const req = new Request("http://localhost/teams/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Missing teamName, teamCode, name
        email: "test@example.com",
      }),
    });
    
    const res = await app.fetch(req, mockEnv());

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty("error");
  });

  it("should create team and user successfully", async () => {
    const mockDb = mockDbContext();
    const app = new Hono();
    
    app.use("*", injectMockDb(mockDb));
    app.route("/teams", createTeam);

    const req = new Request("http://localhost/teams/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamName: "Test Team",
        teamCode: "test-code",
        name: "Test User",
      }),
    });
    
    const res = await app.fetch(req, mockEnv());

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("message");
    
    // Verify repository methods were called
    expect(mockDb.transaction).toHaveBeenCalled();
    expect(mockTeamCreate).toHaveBeenCalled();
    expect(mockUserCreate).toHaveBeenCalled();
    
    // Verify team data
    const teamCreateCall = mockTeamCreate.mock.calls[0][0];
    expect(teamCreateCall).toMatchObject({
      name: "Test Team",
      code: "test-code",
    });
    expect(teamCreateCall.id).toBeDefined();
    
    // Verify user data
    const userCreateCall = mockUserCreate.mock.calls[0][0];
    expect(userCreateCall).toMatchObject({
      supabaseUserId: "user-123",
      name: "Test User",
      status: 0, // USER_STATUS.PENDING - waiting for email verification
      roleId: 0, // Will be updated to OWNER after activation
    });
    expect(userCreateCall.id).toBeDefined();
    expect(userCreateCall.teamId).toBeDefined();
  });

  it("should handle database errors gracefully", async () => {
    mockTeamCreate.mockRejectedValue(new Error("Database error"));
    
    const mockDb = mockDbContext();
    const app = new Hono();
    
    app.use("*", injectMockDb(mockDb));
    app.route("/teams", createTeam);

    const req = new Request("http://localhost/teams/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamName: "Test Team",
        teamCode: "test-code",
        name: "Test User",
      }),
    });
    
    const res = await app.fetch(req, mockEnv());

    expect(res.status).toBe(500);
  });
});
