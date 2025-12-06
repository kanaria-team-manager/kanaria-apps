import { Hono } from "hono";
import { ulid } from "ulid";
import { createDb } from "../../db/index.js";
import { teams, USER_STATUS, users } from "../../db/schema.js";
// import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Note: This endpoint is public to allow team creation during signup (before email verification)
// app.use("*", authMiddleware); 

app.post("/", async (c) => {
  // const user = c.get("user");
  const { supabaseUserId, teamName, teamCode } = await c.req.json();

  if (!teamName || !teamCode) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);

  try {
    const teamId = ulid();
    const userRecordId = ulid();

    // Use transaction to ensure both team and user (owner) are created
    await db.transaction(async (tx) => {
      await tx.insert(teams).values({
        id: teamId,
        name: teamName,
        code: teamCode,
      });

			// owner user も同時に作成する
      await tx.insert(users).values({
        id: userRecordId,
        supabaseUserId: supabaseUserId,
        teamId: teamId,
        roleId: 0, // 0: owner defaultvalue
				status: USER_STATUS.TEMPORARY,
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
