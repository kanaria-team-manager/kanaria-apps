import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import type { Bindings, Variables } from "../../types";
import { labelsRoute } from "./index";

const mockFindAll = vi.fn();

// Mock Repository
vi.mock("../../db/repositories/LabelRepository", () => {
  return {
    LabelRepository: class {
      findAll = mockFindAll;
    },
  };
});

// Mock createDb to avoid real connection
vi.mock("../../db/index", () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

describe("GET /labels", () => {
  it("should return all labels", async () => {
    const mockLabels = [
      { id: "1", name: "Label 1", systemFlag: 0 },
      { id: "2", name: "Label 2", systemFlag: 1 },
    ];
    mockFindAll.mockResolvedValue(mockLabels);

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
