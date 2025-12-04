import { Hono } from "hono";
import { ulid } from "ulid";
import { createDb } from "../../db/index.js";
import { teams, users } from "../../db/schema.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", authMiddleware);

app.post("/", async (c) => {
  const user = c.get("user");
  const { teamName, teamCode } = await c.req.json();

  if (!teamName || !teamCode) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);

  try {
    const teamId = ulid();
    const userId = ulid();

    // Use transaction to ensure both team and user (owner) are created
    await db.transaction(async (tx) => {
      await tx.insert(teams).values({
        id: teamId,
        name: teamName,
        code: teamCode,
      });

      await tx.insert(users).values({
        id: userId,
        userId: user.id, // Supabase User ID (UUID)
        teamId: teamId,
        roleId: 0, // 0: owner
      });
    });

    return c.json({ message: "Team created successfully", teamId });
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "23505") {
      // Postgres unique violation code
      return c.json({ error: "Team code already taken" }, 409);
    }
    console.error(err);
    return c.json({ error: "Failed to create team" }, 500);
  }
});

export default app;
