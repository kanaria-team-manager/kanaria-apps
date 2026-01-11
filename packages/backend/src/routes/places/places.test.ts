import type { Context, Next } from "hono";
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { injectMockDb, mockDbContext, mockEnv } from "../../test/test-utils.js";
import { placesRoute } from "./places.js";

// Mock repositories
const mockFindAllByTeamId = vi.fn();
const mockFindById = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("../../db/repositories/PlaceRepository.js", () => ({
  PlaceRepository: class {
    findAllByTeamId = mockFindAllByTeamId;
    findById = mockFindById;
    create = mockCreate;
    update = mockUpdate;
    delete = mockDelete;
  },
}));

const mockFindBySupabaseId = vi.fn();

vi.mock("../../db/repositories/UserRepository.js", () => ({
  UserRepository: class {
    findBySupabaseId = mockFindBySupabaseId;
  },
}));

// Mock auth middleware
vi.mock("../../middleware/auth.js", () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set("user", {
      id: "user-123",
      email: "test@example.com",
    });
    await next();
  },
}));

describe("Places Route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: user exists with team
    mockFindBySupabaseId.mockResolvedValue({
      id: "user-123",
      teamId: "team-123",
      supabaseUserId: "user-123",
      roleId: 0,
    });
  });

  describe("GET /places", () => {
    it("should return places for team", async () => {
      const mockPlaces = [
        { id: "place-1", name: "Place 1", teamId: "team-123" },
        { id: "place-2", name: "Place 2", teamId: "team-123" },
      ];
      mockFindAllByTeamId.mockResolvedValue(mockPlaces);

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/places", placesRoute);

      const req = new Request("http://localhost/places", {
        headers: { "Content-Type": "application/json" },
      });

      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockPlaces);
      expect(mockFindBySupabaseId).toHaveBeenCalledWith("user-123");
      expect(mockFindAllByTeamId).toHaveBeenCalledWith("team-123");
    });

    it("should return 403 if user has no team", async () => {
      mockFindBySupabaseId.mockResolvedValue({
        id: "user-123",
        teamId: null,
      });

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/places", placesRoute);

      const req = new Request("http://localhost/places");
      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(403);
    });
  });
});
