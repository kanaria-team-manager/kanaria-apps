import { Hono } from "hono";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", authMiddleware);

app.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new UserRepository(db);

  const teamId = user.app_metadata?.teamId as string | undefined;

  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const users = await repo.findAllByTeamId(teamId);
  return c.json(users);
});

export default app;
