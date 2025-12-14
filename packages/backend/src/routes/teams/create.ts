import { Hono } from "hono";
import { ulid } from "ulid";
import { TeamRepository } from "../../db/repositories/TeamRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { USER_STATUS } from "../../db/schema.js";
// import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Note: This endpoint is public to allow team creation during signup (before email verification)
// app.use("*", authMiddleware);

app.post("/", async (c) => {
  // const user = c.get("user");
  const { supabaseUserId, teamName, teamCode, name, email } =
    await c.req.json();

  if (!teamName || !teamCode || !name || !email) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const db = c.get("db");
  const teamRepo = new TeamRepository(db);
  const userRepo = new UserRepository(db);

  try {
    const teamId = ulid();
    const userRecordId = ulid();

    // Use transaction to ensure both team and user (owner) are created
    await db.transaction(async (tx) => {
      await teamRepo.create(
        {
          id: teamId,
          name: teamName,
          code: teamCode,
        },
        tx,
      );

      // owner user も同時に作成する
      await userRepo.create(
        {
          id: userRecordId,
          supabaseUserId: supabaseUserId,
          teamId: teamId,
          roleId: 0, // 0: owner defaultvalue
          status: USER_STATUS.TEMPORARY,
          name,
          email,
        },
        tx,
      );
    });
    
    // Metadata update moved to login logic per user request.

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
