import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { playersRoute } from "./players.js";

// Mock the db module
vi.mock("../../db/index.js");

// Mock the auth middleware to bypass authentication
vi.mock("../../middleware/auth.js", () => ({
  authMiddleware: async (
    c: { set: (key: string, value: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set("user", {
      id: "supabase_user_123",
      app_metadata: { teamId: "team_123" },
    });
    await next();
  },
}));

const mockCreateWithTag = vi.fn();
const mockFindById = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateTags = vi.fn();
const mockFindAll = vi.fn();
const mockFindBySupabaseId = vi.fn();

// Mock PlayerRepository
vi.mock("../../db/repositories/PlayerRepository.js", () => ({
  PlayerRepository: class {
    createWithTag = mockCreateWithTag;
    findById = mockFindById;
    update = mockUpdate;
    updateTags = mockUpdateTags;
    findAll = mockFindAll;
  },
}));

// Mock UserRepository
vi.mock("../../db/repositories/UserRepository.js", () => ({
  UserRepository: class {
    findBySupabaseId = mockFindBySupabaseId;
  },
}));

describe("POST /players", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock for finding current user
    mockFindBySupabaseId.mockResolvedValue({
      id: "user_123",
      teamId: "team_123",
      roleId: 0, // OWNER
      supabaseUserId: "supabase_user_123",
    });
  });

  it("should create a player successfully", async () => {
    const mockPlayer = {
      id: "player_123",
      lastName: "山田",
      firstName: "太郎",
      nickName: "たろう",
      imageUrl: null,
      teamId: "team_123",
      parentUserId: "user_123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCreateWithTag.mockResolvedValue(mockPlayer);

    const app = new Hono();

    // Inject mock DB
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", {});
      await next();
    });

    app.route("/players", playersRoute);

    const req = new Request("http://localhost/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastName: "山田",
        firstName: "太郎",
        nickName: "たろう",
        tagId: "tag_123",
      }),
    });
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe("player_123");
  });

  it("should get a player by id", async () => {
    const mockPlayer = {
      id: "player_123",
      lastName: "山田",
      firstName: "太郎",
      nickName: "たろう",
      imageUrl: null,
      teamId: "team_123",
    };

    mockFindById.mockResolvedValue(mockPlayer);

    const app = new Hono();

    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", {});
      await next();
    });

    app.route("/players", playersRoute);

    const res = await app.request("/players/player_123");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe("player_123");
  });

  it("should list players with tag filter", async () => {
    const mockPlayers = [
      {
        player: {
          id: "player_tagged",
          lastName: "佐藤",
          firstName: "花子",
          nickName: null,
          imageUrl: null,
          teamId: "team_123",
        },
        tag: { id: "tag_123", name: "1年生" },
      },
    ];

    mockFindAll.mockResolvedValue(mockPlayers);

    const app = new Hono();
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", {});
      await next();
    });
    app.route("/players", playersRoute);

    const res = await app.request("/players?tagIds=tag_123");
    expect(res.status).toBe(200);
  });

  it("should search players by name", async () => {
    const mockPlayers = [
      {
        player: {
          id: "player_searched",
          lastName: "検索",
          firstName: "結果",
          nickName: null,
          imageUrl: null,
          teamId: "team_123",
        },
        tag: null,
      },
    ];

    mockFindAll.mockResolvedValue(mockPlayers);

    const app = new Hono();
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", {});
      await next();
    });
    app.route("/players", playersRoute);

    const res = await app.request("/players?q=検索");
    expect(res.status).toBe(200);
  });

  it("should update a player successfully", async () => {
    const mockUpdatedPlayer = {
      id: "player_123",
      lastName: "更新後",
      firstName: "太郎",
      nickName: "たろちゃん",
      imageUrl: null,
      teamId: "team_123",
    };

    mockUpdate.mockResolvedValue(mockUpdatedPlayer);
    mockFindById.mockResolvedValue(mockUpdatedPlayer);

    const app = new Hono();
    app.use("*", async (c, next) => {
      // @ts-expect-error Mocking context
      c.set("db", {});
      await next();
    });
    app.route("/players", playersRoute);

    const req = new Request("http://localhost/players/player_123", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastName: "更新後",
        nickName: "たろちゃん",
      }),
    });
    const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { lastName: string };
    expect(data.lastName).toBe("更新後");
    expect(mockUpdate).toHaveBeenCalled();
  });
});
