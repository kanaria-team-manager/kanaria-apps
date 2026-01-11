import type { Context, Next } from "hono";
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import activateTeam from "./activate.js";

// Mock modules
vi.mock("../../db/index.js", () => ({
  createDb: vi.fn(),
}));

// Mock auth middleware
vi.mock("../../middleware/auth.js", () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set("user", {
      id: "test-user-123",
      email: "test@example.com",
    });
    await next();
  },
}));

const mockFindBySupabaseId = vi.fn();
const mockUpdateStatusUser = vi.fn();
const mockUpdateStatusTeam = vi.fn();

// Mock UserRepository
vi.mock("../../db/repositories/UserRepository.js", () => ({
  UserRepository: class {
    findBySupabaseId = mockFindBySupabaseId;
    updateStatus = mockUpdateStatusUser;
  },
}));

// Mock TeamRepository
vi.mock("../../db/repositories/TeamRepository.js", () => ({
  TeamRepository: class {
    updateStatus = mockUpdateStatusTeam;
    create = vi.fn();
    findByCode = vi.fn();
  },
}));

describe("GET /teams/activate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 404 if user not found", async () => {
    mockFindBySupabaseId.mockResolvedValue(null);

    const app = new Hono();

    // Inject mock DB
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", {
        transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => {
          await callback({});
        }),
      });
      await next();
    });

    app.route("/teams", activateTeam);

    const req = new Request("http://localhost/teams/activate");
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(404);
  });

  it("should activate user and team successfully", async () => {
    mockFindBySupabaseId.mockResolvedValue({
      id: "user_rec_1",
      teamId: "team_1",
      status: 0, // TEMPORARY
      roleId: 0, // OWNER
    });
    mockUpdateStatusUser.mockResolvedValue(undefined);
    mockUpdateStatusTeam.mockResolvedValue(undefined);

    const mockDb = {
      transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => {
        const mockTx = {};
        await callback(mockTx);
      }),
    };

    const app = new Hono();

    // Inject mock DB
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      await next();
    });

    app.route("/teams", activateTeam);

    const req = new Request("http://localhost/teams/activate");
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ message: "Activation successful" });

    expect(mockUpdateStatusUser).toHaveBeenCalledWith(
      "user_rec_1",
      1, // CONFIRMED
      expect.anything(),
    );
    expect(mockUpdateStatusTeam).toHaveBeenCalledWith(
      "team_1",
      1, // ACTIVE
      expect.anything(),
    );
  });
});
