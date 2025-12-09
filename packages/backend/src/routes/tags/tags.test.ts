import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import type { Bindings, Variables } from "../../types";
import { tagsRoute } from "./index";

const mockFindAll = vi.fn();

// Mock Repository
vi.mock("../../db/repositories/TagRepository", () => {
  return {
    TagRepository: class {
      findAll = mockFindAll;
    },
  };
});

// Mock createDb
vi.mock("../../db/index", () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

describe("GET /tags", () => {
  it("should return all tags", async () => {
    const mockTags = [
      { id: "1", name: "Tag 1", labelId: "l1", systemFlag: 0 },
      { id: "2", name: "Tag 2", labelId: "l2", systemFlag: 1 },
    ];
    mockFindAll.mockResolvedValue(mockTags);

    const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Inject mock DB
    app.use("*", async (c, next) => {
        // biome-ignore lint/suspicious/noExplicitAny: Mocking DB
        c.set("db", {} as any);
        await next();
    });

    app.route("/", tagsRoute);

    const res = await app.request("/", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockTags);
  });
});
