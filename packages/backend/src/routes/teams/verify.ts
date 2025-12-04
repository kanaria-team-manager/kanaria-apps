import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDb } from "../../db/index.js";
import { teams } from "../../db/schema.js";

type Bindings = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/verify/:code", async (c) => {
  const code = c.req.param("code");
  const db = createDb(c.env.DATABASE_URL);

  try {
    const result = await db
      .select()
      .from(teams)
      .where(eq(teams.code, code))
      .limit(1);

    if (result.length === 0) {
      return c.json({ error: "Team not found" }, 404);
    }

    return c.json({
      id: result[0].id,
      name: result[0].name,
      code: result[0].code,
    });
  } catch (e) {
    console.error(e);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default app;
