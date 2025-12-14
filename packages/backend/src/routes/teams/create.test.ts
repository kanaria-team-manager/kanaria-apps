import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as dbModule from "../../db/index.js";
import createTeam from "./create.js";

// Mock the db module
vi.mock("../../db/index.js");

describe("POST /teams", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 400 if fields are missing", async () => {
    const app = new Hono();

    // Inject mock DB
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", {} as typeof dbModule);
      await next();
    });

    app.route("/teams", createTeam);

    const req = new Request("http://localhost/teams", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(400);
  });

  it("should create team and user successfully", async () => {
    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
      transaction: vi.fn(async (callback) => {
        await callback(mockTx);
      }),
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

    app.route("/teams", createTeam);

    const req = new Request("http://localhost/teams", {
      method: "POST",
      body: JSON.stringify({
        supabaseUserId: "user_123",
        teamName: "Test Team",
        teamCode: "test-code",
        name: "Test User",
        email: "test@example.com",
      }),
    });
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("message", "Team created successfully");
    expect(mockDb.transaction).toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalledTimes(2); // Teams and Users
  });
});
