import { redirect } from "@sveltejs/kit";
import { apiGet, apiPut } from "$lib/server/api/client";
import { fetchTags } from "$lib/server/api/master";
import type {
  UserWithTags,
  CurrentUser,
  TagSimple,
} from "@kanaria/shared";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, locals, params }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token;

  if (!session) {
    redirect(303, "/auth/login");
  }

  if (!accessToken) {
    return {
      targetUser: null,
      currentUser: null,
      allTags: [],
      error: "認証が必要です",
    };
  }

  const userId = params.id;

  try {
    const [user, allTags, currentUser] = await Promise.all([
      apiGet<UserWithTags>(`/users/${userId}`, accessToken, { fetch }),
      fetchTags(fetch, accessToken),
      apiGet<CurrentUser>("/users/me", accessToken, { fetch }),
    ]);

    return { targetUser: user, currentUser, allTags: allTags as TagSimple[] };
  } catch (e) {
    console.error("Failed to load user data:", e);
    return {
      targetUser: null,
      currentUser: null,
      allTags: [],
      error: "ユーザー情報の取得に失敗しました",
    };
  }
};

export const actions = {
  updateName: async ({ request, locals, fetch, params }) => {
    const { session } = await locals.safeGetSession();
    if (!session || !session.access_token) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const name = data.get("name")?.toString();

    if (!name || !name.trim()) {
      return { success: false, error: "名前は必須です" };
    }

    try {
      await apiPut(
        `/users/${params.id}`,
        { name: name.trim() },
        session.access_token,
        { fetch }
      );
      return { success: true };
    } catch (e) {
      console.error("Failed to update name", e);
      return { success: false, error: "名前の更新に失敗しました" };
    }
  },
  
  updateTags: async ({ request, locals, fetch, params }) => {
    const { session } = await locals.safeGetSession();
    if (!session || !session.access_token) throw redirect(303, "/auth/login");

    const data = await request.formData();
    // Assuming tags are passed as a JSON array string
    const tagIdsStr = data.get("tagIds")?.toString();
    
    if (!tagIdsStr) {
       return { success: false, error: "Invalid tags" };
    }

    try {
      const tagIds = JSON.parse(tagIdsStr);
      if (!Array.isArray(tagIds) || !tagIds.every(id => typeof id === "string")) {
        return { success: false, error: "Invalid tags format" };
      }
      await apiPut(
        `/users/${params.id}/tags`,
        { tagIds },
        session.access_token,
        { fetch }
      );
      return { success: true };
    } catch (e) {
      console.error("Failed to update tags", e);
      return { success: false, error: "タグの更新に失敗しました" };
    }
  }
};
