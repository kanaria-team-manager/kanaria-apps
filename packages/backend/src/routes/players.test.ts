import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as dbModule from "../db/index.js";
import { playersRoute } from "./players/index.js";

// Mock the db module
vi.mock("../db/index.js");

describe("POST /players", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should create a player successfully", async () => {
    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          id: "player_123",
          name: "Test Player",
          teamId: "team_123",
          parentUserId: "user_123",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };

    const mockDb = {
      ...mockTx, // Allow direct calls if no transaction
    };

    // @ts-expect-error Mocking context
    dbModule.createDb.mockReturnValue(mockDb);

    const app = new Hono();

    // Inject mock DB and User
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      // @ts-expect-error Mocking context
      c.set("user", {
        id: "user_123",
        app_metadata: { teamId: "team_123" },
      });
      await next();
    });

    app.route("/players", playersRoute);

    const req = new Request("http://localhost/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Player",
        // teamId and parentUserId are from context, removed from body
      }),
    });
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe("player_123");
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should get a player by id", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        {
          id: "player_123",
          name: "Test Player",
          teamId: "team_123",
        },
      ]),
    };

    // @ts-expect-error Mocking context
    dbModule.createDb.mockReturnValue(mockDb);

    const app = new Hono();

    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      // @ts-expect-error Mocking context
      c.set("user", {
        id: "user_123",
        app_metadata: { teamId: "team_123" },
      });
      await next();
    });

    app.route("/players", playersRoute);

    const res = await app.request("/players/player_123");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe("player_123");
  });

  it("should list players with tag filter", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(), // For tag join
      orderBy: vi.fn().mockReturnThis(), // Returns this, but we need to resolve data at end of chain
      $dynamic: vi.fn().mockReturnThis(),
      // Make the chain awaitable to return the data
      // biome-ignore lint/suspicious/noThenProperty: Mocking Promise behavior
      then: (resolve: (arg: unknown) => unknown) => resolve([
        {
          id: "player_tagged",
          name: "Tagged Player",
          teamId: "team_123",
        },
      ]),
    };

    // @ts-expect-error Mocking context
    dbModule.createDb.mockReturnValue(mockDb);
    const app = new Hono();
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      // @ts-expect-error Mocking context
      c.set("user", {
        id: "user_123",
        app_metadata: { teamId: "team_123" },
      });
      await next();
    });
    app.route("/players", playersRoute);

    const res = await app.request("/players?tag=tag_123");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string }[];
    expect(data).toHaveLength(1);
    expect(mockDb.innerJoin).toHaveBeenCalled(); // Should join taggables
  });

  it("should search players by name", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      $dynamic: vi.fn().mockReturnThis(),
      // biome-ignore lint/suspicious/noThenProperty: Mocking Promise behavior
      then: (resolve: (arg: unknown) => unknown) => resolve([
        {
          id: "player_searched",
          name: "Searched Player",
          teamId: "team_123",
        },
      ]),
    };
    
    // @ts-expect-error Mocking context
    dbModule.createDb.mockReturnValue(mockDb);
    const app = new Hono();
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      // @ts-expect-error Mocking context
      c.set("user", {
        id: "user_123",
        app_metadata: { teamId: "team_123" },
      });
      await next();
    });
    app.route("/players", playersRoute);
    
    const res = await app.request("/players?name=Searched");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    // Should call ILIKE logic - difficult to test exact query construction with this mock, 
    // but at least we verify route logic passes param.
    // In real integration test we'd check DB results.
  });

  it("should update a player successfully", async () => {
    const mockDb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          id: "player_123",
          name: "Updated Player",
          teamId: "team_123",
        },
      ]),
    };

    // @ts-expect-error Mocking context
    dbModule.createDb.mockReturnValue(mockDb);
    const app = new Hono();
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", mockDb);
      // @ts-expect-error Mocking context
      c.set("user", {
        id: "user_123",
        app_metadata: { teamId: "team_123" },
      });
      await next();
    });
    app.route("/players", playersRoute);

    const req = new Request("http://localhost/players/player_123", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Player",
      }),
    });
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe("Updated Player");
    expect(mockDb.update).toHaveBeenCalled();
  });
});
