import { createClient } from "@supabase/supabase-js";
import type { Context, Next } from "hono";
import type { Bindings, Variables } from "../types.js";

/**
 * Supabase User ID検証ミドルウェア
 * メール未確認ユーザーのための特別な検証
 * リクエストボディの`supabaseUserId`をSupabase Admin APIで検証
 */
export const verifySupabaseUser = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) => {
  const body = await c.req.json();
  const { supabaseUserId } = body;

  if (!supabaseUserId) {
    return c.json({ error: "supabaseUserId is required" }, 400);
  }

  // Supabase Admin APIでユーザーを検証
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: userData, error } =
    await supabase.auth.admin.getUserById(supabaseUserId);

  if (error || !userData?.user) {
    return c.json({ error: "Invalid or non-existent user" }, 401);
  }

  const user = userData.user;

  // 検証済みユーザー情報をコンテキストに設定
  c.set("verifiedUser", {
    id: user.id,
    email: user.email || "",
    app_metadata: user.app_metadata || {},
    user_metadata: user.user_metadata || {},
  });

  // 元のリクエストボディを復元（次のハンドラーで使用可能に）
  c.set("requestBody", body);

  await next();
};
