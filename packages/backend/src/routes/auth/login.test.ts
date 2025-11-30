import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import login from "./login.js";

describe("POST /auth/login", () => {
  it("should return 201 status code", async () => {
    const app = new Hono();
    app.route("/auth/login", login);

    const req = new Request("http://localhost/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "test@example.com", password: "password" }),
    });

    const res = await app.fetch(req);
    expect(res.status).toBe(200);
  });

  it("should return 201 status code even without request body", async () => {
    const app = new Hono();
    app.route("/auth/login", login);

    const req = new Request("http://localhost/auth/login", {
      method: "POST",
    });

    const res = await app.fetch(req);
    expect(res.status).toBe(200);
  });

  it("should return JSON response with message", async () => {
    const app = new Hono();
    app.route("/auth/login", login);

    const req = new Request("http://localhost/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "test@example.com", password: "password" }),
    });

    const res = await app.fetch(req);
    const data = await res.json();
    expect(data).toEqual({ message: "Login endpoint" });
  });
});
