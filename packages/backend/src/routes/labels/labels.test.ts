import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import type { Bindings, Variables } from "../../types";
import { labelsRoute } from "./labels.js";

const mockFindByTeamAndType = vi.fn();
const mockFindBySupabaseId = vi.fn();

// Mock Repository
vi.mock("../../db/repositories/LabelRepository", () => {
  return {
    LabelRepository: class {
      findByTeamAndType = mockFindByTeamAndType;
    },
  };
});

vi.mock("../../db/repositories/UserRepository", () => {
  return {
    UserRepository: class {
      findBySupabaseId = mockFindBySupabaseId;
    },
  };
});

// Mock createDb to avoid real connection
vi.mock("../../db/index", () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

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

describe("GET /labels", () => {
  it("should return all labels", async () => {
    const mockLabels = [
      { id: "1", name: "Label 1", systemFlag: 0 },
      { id: "2", name: "Label 2", systemFlag: 1 },
    ];

    // Mock finding current user
    mockFindBySupabaseId.mockResolvedValue({
      id: "user_123",
      teamId: "team_123",
    });

    mockFindByTeamAndType.mockResolvedValue(mockLabels);

    const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

    // Inject mock DB
    app.use("*", async (c, next) => {
      // biome-ignore lint/suspicious/noExplicitAny: Mocking DB
      c.set("db", {} as any);
      await next();
    });

    app.route("/", labelsRoute);

    const res = await app.request("/", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockLabels);
  });
});
