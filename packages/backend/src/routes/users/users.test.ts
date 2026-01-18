import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerRepository } from "../../db/repositories/PlayerRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import usersApp from "./users.js";

// Mock auth middleware
vi.mock("../../middleware/auth.js", () => ({
  authMiddleware: vi.fn(async (_c, next) => {
    // User is set by test setup
    await next();
  }),
}));

describe("User Management API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /users/:id", () => {
    it("should return user details with tags for owner/admin", async () => {
      const mockUserWithTags = {
        id: "user_123",
        name: "Test User",
        email: "test@example.com",
        roleId: 2,
        teamId: "team_123",
        tags: [{ id: "tag_1", name: "Tag 1" }],
      };

      const mockPlayers = [
        {
          id: "player_1",
          lastName: "田中",
          firstName: "太郎",
          nickName: null,
          tags: [],
        },
      ];

      // Mock UserRepository
      vi.spyOn(UserRepository.prototype, "findByIdWithTags").mockResolvedValue(
        mockUserWithTags,
      );

      // Mock PlayerRepository
      vi.spyOn(
        PlayerRepository.prototype,
        "findByParentUserId",
      ).mockResolvedValue(mockPlayers);

      const app = new Hono();

      // Mock auth user (owner)
      app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {});
        // @ts-expect-error Mocking user
        c.set("user", {
          id: "owner_supabase_id",
          app_metadata: { teamId: "team_123", roleId: 0 },
        });
        await next();
      });

      app.route("/users", usersApp);

      const req = new Request("http://localhost/users/user_123");
      const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("user_123");
      expect(data.tags).toHaveLength(1);
      expect(data.players).toBeDefined();
      expect(Array.isArray(data.players)).toBe(true);
    });

    it("should return 403 for regular user", async () => {
      const app = new Hono();

      app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {});
        // @ts-expect-error Mocking user (regular user, role=2)
        c.set("user", {
          id: "user_supabase_id",
          app_metadata: { teamId: "team_123", roleId: 2 },
        });
        await next();
      });

      app.route("/users", usersApp);

      const req = new Request("http://localhost/users/user_123");
      const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /users/:id/role", () => {
    it("should update user role for owner/admin", async () => {
      const mockUser = {
        id: "user_123",
        roleId: 2,
        teamId: "team_123",
        tags: [],
      };

      const mockUpdatedUser = {
        id: "user_123",
        roleId: 1,
        teamId: "team_123",
      };

      vi.spyOn(UserRepository.prototype, "findByIdWithTags").mockResolvedValue(
        mockUser,
      );
      vi.spyOn(UserRepository.prototype, "updateRole").mockResolvedValue(
        mockUpdatedUser,
      );

      const app = new Hono();

      app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {});
        // @ts-expect-error Mocking user (owner)
        c.set("user", {
          id: "owner_supabase_id",
          app_metadata: { teamId: "team_123", roleId: 0 },
        });
        await next();
      });

      app.route("/users", usersApp);

      const req = new Request("http://localhost/users/user_123/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: 1 }),
      });
      const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.roleId).toBe(1);
    });

    it("should reject changing owner role (roleId: 0)", async () => {
      const mockOwner = {
        id: "owner_123",
        roleId: 0,
        teamId: "team_123",
        tags: [],
      };

      vi.spyOn(UserRepository.prototype, "findByIdWithTags").mockResolvedValue(
        mockOwner,
      );

      const app = new Hono();

      app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {});
        // @ts-expect-error Mocking user (owner trying to change own role)
        c.set("user", {
          id: "owner_supabase_id",
          app_metadata: { teamId: "team_123", roleId: 0 },
        });
        await next();
      });

      app.route("/users", usersApp);

      const req = new Request("http://localhost/users/owner_123/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: 1 }),
      });
      const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("Cannot change owner role");
    });

    it("should return 403 for regular user", async () => {
      const app = new Hono();

      app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {});
        // @ts-expect-error Mocking user (regular user)
        c.set("user", {
          id: "user_supabase_id",
          app_metadata: { teamId: "team_123", roleId: 2 },
        });
        await next();
      });

      app.route("/users", usersApp);

      const req = new Request("http://localhost/users/user_123/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: 1 }),
      });
      const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /users/:id", () => {
    it("should update user name for owner/admin", async () => {
      const mockUser = {
        id: "user_123",
        name: "Old Name",
        teamId: "team_123",
        tags: [],
      };

      const mockUpdatedUser = {
        id: "user_123",
        name: "New Name",
        teamId: "team_123",
      };

      vi.spyOn(UserRepository.prototype, "findByIdWithTags").mockResolvedValue(
        mockUser,
      );
      vi.spyOn(UserRepository.prototype, "updateProfile").mockResolvedValue(
        mockUpdatedUser,
      );

      const app = new Hono();

      app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {});
        // @ts-expect-error Mocking user (admin)
        c.set("user", {
          id: "admin_supabase_id",
          app_metadata: { teamId: "team_123", roleId: 1 },
        });
        await next();
      });

      app.route("/users", usersApp);

      const req = new Request("http://localhost/users/user_123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      });
      const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe("New Name");
    });

    it("should return 403 for regular user", async () => {
      const app = new Hono();

      app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {});
        // @ts-expect-error Mocking user (regular user)
        c.set("user", {
          id: "user_supabase_id",
          app_metadata: { teamId: "team_123", roleId: 2 },
        });
        await next();
      });

      app.route("/users", usersApp);

      const req = new Request("http://localhost/users/user_123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hacker" }),
      });
      const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /users/:id/tags", () => {
    it("should update user tags for owner/admin", async () => {
      const mockUser = {
        id: "user_123",
        teamId: "team_123",
        tags: [],
      };

      const mockUpdatedTags = [
        { id: "tag_1", name: "Tag 1" },
        { id: "tag_2", name: "Tag 2" },
      ];

      vi.spyOn(UserRepository.prototype, "findByIdWithTags").mockResolvedValue(
        mockUser,
      );
      vi.spyOn(UserRepository.prototype, "updateTags").mockResolvedValue(
        mockUpdatedTags,
      );

      const app = new Hono();

      app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {});
        // @ts-expect-error Mocking user (owner)
        c.set("user", {
          id: "owner_supabase_id",
          app_metadata: { teamId: "team_123", roleId: 0 },
        });
        await next();
      });

      app.route("/users", usersApp);

      const req = new Request("http://localhost/users/user_123/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: ["tag_1", "tag_2"] }),
      });
      const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(2);
    });

    it("should return 403 for regular user", async () => {
      const app = new Hono();

      app.use("*", async (c, next) => {
        // @ts-expect-error Mocking context
        c.set("db", {});
        // @ts-expect-error Mocking user (regular user)
        c.set("user", {
          id: "user_supabase_id",
          app_metadata: { teamId: "team_123", roleId: 2 },
        });
        await next();
      });

      app.route("/users", usersApp);

      const req = new Request("http://localhost/users/user_123/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: [] }),
      });
      const res = await app.fetch(req, { DATABASE_URL: "mock-url" });

      expect(res.status).toBe(403);
    });
  });
});
