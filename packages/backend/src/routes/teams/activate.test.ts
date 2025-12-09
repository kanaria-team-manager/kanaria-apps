import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamRepository } from "../../db/repositories/TeamRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import activateTeam from "./activate.js";

// Mock modules
vi.mock("../../db/index.js", () => ({
  createDb: vi.fn(),
}));
vi.mock("../../db/repositories/UserRepository.js");
vi.mock("../../db/repositories/TeamRepository.js");

// Mock auth middleware
vi.mock("../../middleware/auth.js", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mock Middleware
  authMiddleware: async (c: any, next: any) => {
    c.set("user", { id: "user_123" });
    await next();
  },
}));

describe("GET /teams/activate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 404 if user not found", async () => {
    // Mock UserRepository behavior
    vi.mocked(UserRepository).mockImplementation(
      class {
        findBySupabaseId = vi.fn().mockResolvedValue(null);
        updateStatus = vi.fn();
        // biome-ignore lint/suspicious/noExplicitAny: Mock Implementation
      } as any,
    );

    const app = new Hono();

    // Inject mock DB
    app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {} as any);
        await next();
    });

    app.route("/teams", activateTeam);

    const req = new Request("http://localhost/teams/activate");
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(404);
  });

  it("should activate user and team successfully", async () => {
    const mockUpdateStatusUser = vi.fn();
    const mockUpdateStatusTeam = vi.fn();

    vi.mocked(UserRepository).mockImplementation(
      class {
        findBySupabaseId = vi.fn().mockResolvedValue({
          id: "user_rec_1",
          teamId: "team_1",
          status: 0, // TEMPORARY
        });
        updateStatus = mockUpdateStatusUser;
        // biome-ignore lint/suspicious/noExplicitAny: Mock Implementation
      } as any,
    );

    vi.mocked(TeamRepository).mockImplementation(
      class {
        updateStatus = mockUpdateStatusTeam;
        create = vi.fn();
        findByCode = vi.fn();
        // biome-ignore lint/suspicious/noExplicitAny: Mock Implementation
      } as any,
    );

    // Need to mock db.transaction as well because activate.ts calls db.transaction
    // But wait, activate.ts calls db.transaction directly on db object.
    // So I still need to mock db object returned by createDb.
    const mockDb = {
      transaction: vi.fn(async (callback) => {
        await callback({}); // pass dummy tx
      }),
    };
    const { createDb } = await import("../../db/index.js");
    // biome-ignore lint/suspicious/noExplicitAny: Mock DB
    vi.mocked(createDb).mockReturnValue(mockDb as any);

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
      1,
      expect.anything(),
    );
    expect(mockUpdateStatusTeam).toHaveBeenCalledWith(
      "team_1",
      1,
      expect.anything(),
    );
  });
});
