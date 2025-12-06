import { Hono } from "hono";
import { createDb } from "../../db/index.js";
import { TeamRepository } from "../../db/repositories/TeamRepository.js";
import { TEAM_STATUS } from "../../db/schema.js";

type Bindings = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/verify/:code", async (c) => {
  const code = c.req.param("code");
  const db = createDb(c.env.DATABASE_URL);
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
  } catch (e) {
    console.error(e);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default app;
