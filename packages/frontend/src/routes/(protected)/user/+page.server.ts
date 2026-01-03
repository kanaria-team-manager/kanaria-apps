import { fail } from "@sveltejs/kit";
import { apiGet, apiPut } from "$lib/api/client";
import { fetchTags } from "$lib/api/master";
import type { Tag } from "$lib/api/types";
import type { Actions, PageServerLoad } from "./$types";

interface UserTag {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  roleId: number;
  tags: UserTag[];
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    return { user: null, allTags: [] };
  }

  try {
    const [user, allTags] = await Promise.all([
      apiGet<UserProfile>("/users/me", accessToken, { fetch }),
      fetchTags(fetch, accessToken),
    ]);

    return { user, allTags };
  } catch (e) {
    console.error("Failed to load user data:", e);
    return { user: null, allTags: [], error: "ユーザー情報の取得に失敗しました" };
  }
};

export const actions: Actions = {
  updateName: async ({ request, fetch, locals }) => {
    const { session } = await locals.safeGetSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return fail(401, { nameError: "認証が必要です" });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;

    if (!name?.trim()) {
      return fail(400, { nameError: "名前は必須です" });
    }

    try {
      await apiPut("/users/me", { name: name.trim() }, accessToken, { fetch });
      return { nameSuccess: true };
    } catch (e) {
      console.error("Failed to update name:", e);
      return fail(500, { nameError: "名前の保存に失敗しました" });
    }
  },

  addTag: async ({ request, fetch, locals }) => {
    const { session } = await locals.safeGetSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return fail(401, { tagError: "認証が必要です" });
    }

    const formData = await request.formData();
    const tagIdsJson = formData.get("tagIds") as string;

    let tagIds: string[] = [];
    if (tagIdsJson) {
      try {
        tagIds = JSON.parse(tagIdsJson);
      } catch {
        return fail(400, { tagError: "無効なタグデータです" });
      }
    }

    try {
      await apiPut("/users/me/tags", { tagIds }, accessToken, { fetch });
      return { tagSuccess: true };
    } catch (e) {
      console.error("Failed to update tags:", e);
      return fail(500, { tagError: "タグの更新に失敗しました" });
    }
  },

  removeTag: async ({ request, fetch, locals }) => {
    const { session } = await locals.safeGetSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return fail(401, { tagError: "認証が必要です" });
    }

    const formData = await request.formData();
    const tagIdsJson = formData.get("tagIds") as string;

    let tagIds: string[] = [];
    if (tagIdsJson) {
      try {
        tagIds = JSON.parse(tagIdsJson);
      } catch {
        return fail(400, { tagError: "無効なタグデータです" });
      }
    }

    try {
      await apiPut("/users/me/tags", { tagIds }, accessToken, { fetch });
      return { tagSuccess: true };
    } catch (e) {
      console.error("Failed to update tags:", e);
      return fail(500, { tagError: "タグの更新に失敗しました" });
    }
  },
};
