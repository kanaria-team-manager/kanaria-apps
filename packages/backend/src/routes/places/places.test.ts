import { beforeEach, describe, expect, it, vi } from "vitest";
import { placesRoute } from "./places.js";

vi.mock("../../db/repositories/PlaceRepository.js", () => ({
  PlaceRepository: class {
    findAllByTeamId = vi.fn().mockResolvedValue([
      { id: "1", name: "Place 1", teamId: "team-123" },
    ]);
    findById = vi.fn().mockResolvedValue(null);
    create = vi.fn();
    update = vi.fn();
    delete = vi.fn();
  },
}));

vi.mock("../../db/repositories/UserRepository.js", () => ({
  UserRepository: class {
    findBySupabaseId = vi.fn().mockResolvedValue({
      id: "user-123",
      teamId: "team-123",
    });
  },
}));

vi.mock("../../middleware/auth.js", () => ({
  authMiddleware: async (c: any, next: any) => {
    c.set("user", {
      id: "user-123",
      email: "test@example.com",
    });
    await next();
  },
}));

describe("Places Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /places", () => {
    it("should return places for team", async () => {
      const req = new Request("http://localhost/places", {
        headers: { "Content-Type": "application/json" },
      });

      const res = await placesRoute.fetch(req, {
        DATABASE_URL: "mock",
        SUPABASE_URL: "mock",
        SUPABASE_SERVICE_ROLE_KEY: "mock",
        FRONTEND_URL: "mock",
      });

      expect(res.status).toBe(200);
    });
  });
});
