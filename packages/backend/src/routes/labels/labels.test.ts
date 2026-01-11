import type { Context, Next } from "hono";
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { injectMockDb, mockDbContext, mockEnv } from "../../test/test-utils.js";
import { labelsRoute } from "./labels.js";

// Mock repositories
const mockFindByTeamAndType = vi.fn();
const mockFindById = vi.fn();
const mockCreateLabel = vi.fn();
const mockUpdateLabel = vi.fn();
const mockDeleteLabel = vi.fn();

vi.mock("../../db/repositories/LabelRepository.js", () => ({
  LabelRepository: class {
    findByTeamAndType = mockFindByTeamAndType;
    findById = mockFindById;
    create = mockCreateLabel;
    update = mockUpdateLabel;
    delete = mockDeleteLabel;
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
    c.set("userRecord", {
      id: "user-123",
      teamId: "team-123",
      roleId: 0,
    });
    await next();
  },
}));

describe("Labels Route", () => {
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

  describe("GET /labels", () => {
    it("should return labels for team", async () => {
      const mockLabels = [
        {
          id: "label-1",
          name: "Label 1",
          color: "#FF0000",
          teamId: "team-123",
        },
        {
          id: "label-2",
          name: "Label 2",
          color: "#00FF00",
          teamId: "team-123",
        },
      ];
      mockFindByTeamAndType.mockResolvedValue(mockLabels);

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/labels", labelsRoute);

      const req = new Request("http://localhost/labels", {
        headers: { "Content-Type": "application/json" },
      });

      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockLabels);
      expect(mockFindBySupabaseId).toHaveBeenCalledWith("user-123");
      expect(mockFindByTeamAndType).toHaveBeenCalledWith("team-123", undefined);
    });

    it("should filter labels by type", async () => {
      const mockLabels = [
        { id: "label-1", name: "Event Label", color: "#FF0000", type: "event" },
      ];
      mockFindByTeamAndType.mockResolvedValue(mockLabels);

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/labels", labelsRoute);

      const req = new Request("http://localhost/labels?type=event", {
        headers: { "Content-Type": "application/json" },
      });

      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(200);
      expect(mockFindByTeamAndType).toHaveBeenCalledWith("team-123", "event");
    });

    it("should return 403 if user has no team", async () => {
      mockFindBySupabaseId.mockResolvedValue({
        id: "user-123",
        teamId: null,
      });

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/labels", labelsRoute);

      const req = new Request("http://localhost/labels");
      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(403);
    });
  });

  describe("POST /labels", () => {
    it("should create a new label", async () => {
      const newLabel = {
        id: "label-new",
        name: "New Label",
        color: "#0000FF",
        teamId: "team-123",
        systemFlag: 0,
      };
      mockCreateLabel.mockResolvedValue(newLabel);

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/labels", labelsRoute);

      const req = new Request("http://localhost/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Label",
          color: "#0000FF",
        }),
      });

      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toEqual(newLabel);
      expect(mockCreateLabel).toHaveBeenCalledWith({
        teamId: "team-123",
        name: "New Label",
        color: "#0000FF",
      });
    });

    it("should validate color format", async () => {
      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/labels", labelsRoute);

      const req = new Request("http://localhost/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Invalid Color",
          color: "invalid",
        }),
      });

      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(400);
      expect(mockCreateLabel).not.toHaveBeenCalled();
    });

    it("should return 403 if user has no team", async () => {
      mockFindBySupabaseId.mockResolvedValue({
        id: "user-123",
        teamId: null,
      });

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/labels", labelsRoute);

      const req = new Request("http://localhost/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Label",
          color: "#FF0000",
        }),
      });

      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /labels/:id", () => {
    it("should update a label", async () => {
      const existingLabel = {
        id: "label-1",
        name: "Original Label",
        color: "#FF0000",
        teamId: "team-123",
        systemFlag: 0,
      };

      const updatedLabel = {
        id: "label-1",
        name: "Updated Label",
        color: "#FF0000",
        teamId: "team-123",
      };

      mockFindById.mockResolvedValue(existingLabel);
      mockUpdateLabel.mockResolvedValue(updatedLabel);

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/labels", labelsRoute);

      const req = new Request("http://localhost/labels/label-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Label",
        }),
      });

      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(updatedLabel);
      expect(mockFindById).toHaveBeenCalledWith("label-1");
      expect(mockUpdateLabel).toHaveBeenCalledWith("label-1", "team-123", {
        name: "Updated Label",
      });
    });

    it("should return 404 if label not found", async () => {
      mockUpdateLabel.mockResolvedValue(null);

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/labels", labelsRoute);

      const req = new Request("http://localhost/labels/nonexistent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated",
        }),
      });

      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /labels/:id", () => {
    it("should delete a label", async () => {
      const existingLabel = {
        id: "label-1",
        name: "Label to Delete",
        color: "#FF0000",
        teamId: "team-123",
        systemFlag: 0,
      };

      mockFindById.mockResolvedValue(existingLabel);

      const app = new Hono();
      app.use("*", injectMockDb(mockDbContext()));
      app.route("/labels", labelsRoute);

      const req = new Request("http://localhost/labels/label-1", {
        method: "DELETE",
      });

      const res = await app.fetch(req, mockEnv());

      expect(res.status).toBe(200); // DELETE returns 200 with success message
      expect(mockFindById).toHaveBeenCalledWith("label-1");
      expect(mockDeleteLabel).toHaveBeenCalledWith("label-1", "team-123");
    });
  });
});
