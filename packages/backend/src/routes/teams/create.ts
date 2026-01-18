import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import { ulid } from "ulid";
import { TeamRepository } from "../../db/repositories/TeamRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { USER_STATUS } from "../../db/schema.js";
import { verifySupabaseUser } from "../../middleware/verify-supabase-user.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// メール未確認ユーザー用の検証ミドルウェア
app.use("/create", verifySupabaseUser);

app.post("/create", async (c) => {
  const verifiedUser = c.get("verifiedUser");
  const body = c.get("requestBody") as {
    teamName: string;
    teamCode: string;
    name: string;
  };
  const { teamName, teamCode, name } = body;

  if (!teamName || !teamCode || !name) {
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
          supabaseUserId: verifiedUser.id,
          teamId: teamId,
          roleId: 0, // 0: owner defaultvalue
          status: USER_STATUS.TEMPORARY,
          name,
          email: verifiedUser.email,
        },
        tx,
      );
    });

    // Update Supabase User Metadata with teamId and roleId
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Note: We use Admin Client (Service Role) to update user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      verifiedUser.id,
      {
        app_metadata: { teamId, roleId: 0 }, // 0 = owner
      },
    );

    if (updateError) {
      // Failed to update app_metadata, but user is created in DB
    }

    return c.json({ message: "Team created successfully", teamId });
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "23505") {
      // Postgres unique violation code
      return c.json({ error: "Team code already taken" }, 409);
    }
    return c.json({ error: "Failed to create team" }, 500);
  }
});

export default app;
