import { goto, invalidateAll } from "$app/navigation";
import { supabase } from "$lib/supabase";

/**
 * ログアウト処理
 * セッションをクリアしてログインページにリダイレクト
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error);
    throw new Error(error.message);
  }

  // サーバーサイドのセッションを更新
  await invalidateAll();

  // ログインページにリダイレクト
  goto("/auth/login");
}
