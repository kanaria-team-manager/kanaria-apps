import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

/**
 * 認証必須ルートグループの共通レイアウト
 * セッションがない場合はログインページにリダイレクト
 */
export const load: LayoutServerLoad = async ({ parent }) => {
  const { session } = await parent();

  if (!session) {
    throw redirect(303, "/auth/login");
  }

  return { session };
};
