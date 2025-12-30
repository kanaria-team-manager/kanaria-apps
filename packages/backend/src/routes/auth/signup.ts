import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import { ulid } from "ulid";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { USER_STATUS } from "../../db/schema.js";
import type { Bindings, Variables } from "../../types.js";

const ROLE_MEMBER = 2;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 既存チームに参加するユーザーを作成
app.post("/", async (c) => {
  const { supabaseUserId, teamId, name, email } = await c.req.json();

  if (!supabaseUserId || !teamId || !name || !email) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const db = c.get("db");
  const userRepo = new UserRepository(db);

  try {
    const userRecordId = ulid();

    // ユーザーを作成（role=2: member, status=0: TEMPORARY）
    await userRepo.create({
      id: userRecordId,
      supabaseUserId: supabaseUserId,
      teamId: teamId,
      roleId: ROLE_MEMBER,
      status: USER_STATUS.TEMPORARY,
      name,
      email,
    });

    // Supabase User Metadata に teamId を設定
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      supabaseUserId,
      {
        app_metadata: { teamId },
      },
    );

    if (updateError) {
      console.error("Failed to update app_metadata", updateError);
      // ログに残すがリクエストは失敗させない
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
    console.error(err);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

export default app;
