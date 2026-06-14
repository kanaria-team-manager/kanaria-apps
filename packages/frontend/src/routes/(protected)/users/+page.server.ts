import { redirect, fail } from "@sveltejs/kit";
import { apiGet, apiPut } from "$lib/server/api/client";
import { fetchTags } from "$lib/server/api/master";
import type { Actions } from "./$types";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const { session } = await parent();

  if (!session) {
    throw redirect(303, "/auth/login");
  }

  try {
    const [users, allTags, currentUser] = await Promise.all([
      apiGet<any[]>("/users", session.access_token, { fetch }),
      fetchTags(fetch, session.access_token),
      apiGet<any>("/users/me", session.access_token, { fetch }),
    ]);

    return { session, users, allTags, currentUser };
  } catch (error) {
    console.error("Failed to fetch users page data", error);
    return { session, users: [], allTags: [], currentUser: null };
  }
};

export const actions: Actions = {
  updateRole: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) {
      throw redirect(303, "/auth/login");
    }

    const data = await request.formData();
    const userId = data.get("userId")?.toString();
    const roleId = Number(data.get("roleId"));

    if (!userId || isNaN(roleId)) {
      return fail(400, { message: "Invalid request data" });
    }

    try {
      await apiPut(`/users/${userId}/role`, { roleId }, session.access_token, { fetch });
      return { success: true };
    } catch (e) {
      console.error("Failed to update role", e);
      return fail(500, { message: "ロール更新に失敗しました" });
    }
  },
};
