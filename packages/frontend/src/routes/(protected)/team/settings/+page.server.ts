import { redirect, fail } from "@sveltejs/kit";
import { apiGet, apiPut } from "$lib/server/api/client";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const { session, user } = await parent();

  if (!session) {
    throw redirect(303, "/auth/login");
  }

  const roleId = user?.app_metadata?.roleId;

  // roleId 0=owner, 1=admin. Redirect others.
  if (roleId !== 0 && roleId !== 1) {
    throw redirect(303, "/dashboard");
  }

  try {
    const team = await apiGet<any>("/teams/settings", session.access_token, { fetch });
    return { session, team };
  } catch (error) {
    console.error("Failed to load team data:", error);
    return { session, team: null, error: "チーム情報の取得に失敗しました" };
  }
};

export const actions: Actions = {
  updateTeam: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const name = data.get("name")?.toString();
    const description = data.get("description")?.toString() || "";

    if (!name) return fail(400, { error: "チーム名は必須です。" });
    if (name.length > 500 || description.length > 500) {
      return fail(400, { error: "500文字以内で入力してください。" });
    }

    try {
      await apiPut(
        "/teams/settings",
        { name, description },
        session.access_token,
        { fetch }
      );
      return { success: true };
    } catch (e) {
      console.error("Failed to update team:", e);
      return fail(500, { error: "チーム情報の更新に失敗しました。" });
    }
  }
};
