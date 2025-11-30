import { Hono } from "hono";

const app = new Hono();

app.get("/verify/:code", (c) => {
  const code = c.req.param("code");

  if (code === "nothing") {
    return c.json({ error: "Team not found" }, 404);
  }

  return c.json({
    id: "team_123",
    name: "Kanaria FC",
    code: code,
  });
});

export default app;
