import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import verifyTeam from "./verify.js";

describe("GET /teams/verify/:code", () => {
  it("should return 404 if code is 'nothing'", async () => {
    const app = new Hono();
    app.route("/teams", verifyTeam);

    const req = new Request("http://localhost/teams/verify/nothing");
    const res = await app.fetch(req);

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "Team not found" });
  });

  it("should return 200 and team info if code is valid", async () => {
    const app = new Hono();
    app.route("/teams", verifyTeam);

    const req = new Request("http://localhost/teams/verify/test");
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      id: "team_123",
      name: "Kanaria FC",
      code: "test",
    });
  });
});
