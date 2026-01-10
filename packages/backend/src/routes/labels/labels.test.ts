import { beforeEach, describe, expect, it, vi } from "vitest";
import { labelsRoute } from "./labels.js";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("../../db/repositories/LabelRepository.js", () => ({
  LabelRepository: vi.fn().mockImplementation(() => ({<br/>    findByTeamAndType: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("../../db/repositories/UserRepository.js", () => ({
  UserRepository: vi.fn().mockImplementation(() => ({
    findBySupabaseId: vi.fn().mockResolvedValue({
      id: "user-123",
      teamId: "team-123",
    }),
  })),
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

describe("Labels Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /labels", () => {
    it("should return labels", async () => {
      const req = new Request("http://localhost/labels", {
        headers: { "Content-Type": "application/json" },
      });

      const res = await labelsRoute.fetch(req, {
        DATABASE_URL: "mock",
        SUPABASE_URL: "mock",
        SUPABASE_SERVICE_ROLE_KEY: "mock",
        FRONTEND_URL: "mock",
      });

      expect(res.status).toBe(200);
    });
  });

  // POST, PUT, DELETE tests would go here but require more complex mocking
  // For now, keeping it simple to just test that the route works
});
