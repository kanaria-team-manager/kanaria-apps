import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as dbModule from "../../db/index.js";
import verifyTeam from "./verify.js";

// Mock the db module
vi.mock("../../db/index.js");

describe("GET /teams/verify/:code", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 404 if team not found", async () => {
    // Mock DB chain
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // Return empty array
    };

    // @ts-expect-error
    dbModule.createDb.mockReturnValue(mockDb);

    const app = new Hono();

    // Inject mock DB
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      await next();
    });

    app.route("/teams", verifyTeam);

    const req = new Request("http://localhost/teams/verify/nothing");
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "Team not found" });
  });

  it("should return 200 and team info if code is valid", async () => {
    // Mock DB chain
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "team_123",
          name: "Kanaria FC",
          code: "test",
          status: 1, // ACTIVE
        },
      ]),
    };

    // @ts-expect-error
    dbModule.createDb.mockReturnValue(mockDb);

    const app = new Hono();

    // Inject mock DB
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      await next();
    });

    app.route("/teams", verifyTeam);

    const req = new Request("http://localhost/teams/verify/test");
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      id: "team_123",
      name: "Kanaria FC",
      code: "test",
    });
  });
});
