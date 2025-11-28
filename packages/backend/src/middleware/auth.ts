import type { Context, Next } from "hono";

// 将来のSupabase認証用ミドルウェア
// 現在は未使用

export const authMiddleware = async (_c: Context, next: Next) => {
  // TODO: Supabase認証の実装
  await next();
};
