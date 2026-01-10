import { Hono } from "hono";
import { TeamRepository } from "../../db/repositories/TeamRepository.js";
import { TEAM_STATUS } from "../../db/schema.js";
import { rateLimitMiddleware } from "../../middleware/rate-limiter.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Add rate limiting to prevent brute force attacks
app.use("/verify/*", rateLimitMiddleware);

app.get("/verify/:code", async (c) => {
  const code = c.req.param("code");
  const db = c.get("db");
  const teamRepo = new TeamRepository(db);

  try {
    const team = await teamRepo.findByCode(code);

    if (!team || team.status === TEAM_STATUS.CREATED) {
      return c.json({ error: "Team not found" }, 404);
    }

    return c.json({
      id: team.id,
      name: team.name,
      code: team.code,
    });
  } catch {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default app;
