import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { createDb } from "../../db/index.js";
import { teams, TEAM_STATUS, users, USER_STATUS } from "../../db/schema.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", authMiddleware);

app.get("/activate", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DATABASE_URL);

  try {
    // Find the user record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.supabaseUserId, user.id),
    });

    if (!userRecord) {
      console.error("User record not found for:", user.id);
      return c.json({ error: "User not found" }, 404);
    }

    if (userRecord.status === USER_STATUS.CONFIRMED) {
       return c.json({ message: "Already activated" });
    }

    // Update statuses
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ status: USER_STATUS.CONFIRMED })
        .where(eq(users.id, userRecord.id));

      await tx
        .update(teams)
        .set({ status: TEAM_STATUS.ACTIVE })
        .where(eq(teams.id, userRecord.teamId));
    });

    return c.json({ message: "Activation successful" });

  } catch (err) {
    console.error("Activation failed:", err);
    return c.json({ error: "Activation failed" }, 500);
  }
});

export default app;
