import { Hono } from "hono";
import { TeamRepository } from "../../db/repositories/TeamRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { TEAM_STATUS, USER_STATUS } from "../../db/schemas/utils.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", authMiddleware);

app.get("/activate", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const userRepo = new UserRepository(db);
  const teamRepo = new TeamRepository(db);

  try {
    console.log("Activation request for user:", user?.id);
    console.log("USER_STATUS:", USER_STATUS);
    console.log("TEAM_STATUS:", TEAM_STATUS);

    if (!user || !user.id) {
       console.error("User context missing or invalid");
       return c.json({ error: "Invalid user context" }, 401);
    }

    // Find the user record
    const userRecord = await userRepo.findBySupabaseId(user.id);

    if (!userRecord) {
      console.error("User record not found for:", user.id);
      return c.json({ error: "User not found" }, 404);
    }

    if (userRecord.status === USER_STATUS.CONFIRMED) {
      return c.json({ message: "Already activated" });
    }

    // Update statuses
    await db.transaction(async (tx) => {
      await userRepo.updateStatus(userRecord.id, USER_STATUS.CONFIRMED, tx);
      await teamRepo.updateStatus(userRecord.teamId, TEAM_STATUS.ACTIVE, tx);
    });

    return c.json({ message: "Activation successful" });
  } catch (err) {
    console.error("Activation failed details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return c.json({ error: "Activation failed" }, 500);
  }
});

export default app;
