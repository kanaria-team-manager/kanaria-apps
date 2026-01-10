import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import { ulid } from "ulid";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { USER_STATUS } from "../../db/schema.js";
import { verifySupabaseUser } from "../../middleware/verify-supabase-user.js";
import type { Bindings, Variables } from "../../types.js";

const ROLE_MEMBER = 2;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// メール未確認ユーザー用の検証ミドルウェア
app.use("*", verifySupabaseUser);

// 既存チームに参加するユーザーを作成
app.post("/", async (c) => {
  const verifiedUser = c.get("verifiedUser");
  const body = c.get("requestBody") as {
    teamId: string;
    name: string;
  };
  const { teamId, name } = body;

  if (!teamId || !name) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const db = c.get("db");
  const userRepo = new UserRepository(db);

  try {
    const userRecordId = ulid();

    // ユーザーを作成（role=2: member, status=0: TEMPORARY）
    await userRepo.create({
      id: userRecordId,
      supabaseUserId: verifiedUser.id,
      teamId: teamId,
      roleId: ROLE_MEMBER,
      status: USER_STATUS.TEMPORARY,
      name,
      email: verifiedUser.email,
    });

    // Supabase User Metadata に teamId を設定
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      verifiedUser.id,
      {
        app_metadata: { teamId },
      },
    );

    if (updateError) {
      // Failed to update app_metadata, but request succeeds
    }

    return c.json({
      message: "User created successfully",
      userId: userRecordId,
    });
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "23505") {
      return c.json({ error: "User already exists" }, 409);
    }
    return c.json({ error: "Failed to create user" }, 500);
  }
});

export default app;
