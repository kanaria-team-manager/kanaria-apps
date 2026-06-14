import { redirect, fail } from "@sveltejs/kit";
import { apiGet, apiPost, apiPut, apiDelete } from "$lib/server/api/client";
import { fetchLabels } from "$lib/server/api/master";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, fetch }) => {
  const { session } = await parent();

  if (!session) {
    throw redirect(303, "/auth/login");
  }

  const accessToken = session.access_token;
  if (!accessToken) throw redirect(303, "/auth/login");

  try {
    const [tags, allLabels] = await Promise.all([
      apiGet<any[]>("/tags", accessToken, { fetch }),
      fetchLabels(fetch, accessToken, "tag"),
    ]);

    return { session, tags, allLabels };
  } catch (error) {
    console.error("Failed to load tags page data:", error);
    return { session, tags: [], allLabels: [], error: "データの取得に失敗しました" };
  }
};

export const actions: Actions = {
  addTag: async ({ locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    try {
      await apiPost(
        "/tags",
        { name: "新規タグ", color: "#6366f1" },
        session.access_token,
        { fetch }
      );
      return { success: true };
    } catch (e) {
      console.error("Failed to add tag", e);
      return fail(500, { error: "タグの作成に失敗しました" });
    }
  },

  updateTag: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const id = data.get("id")?.toString();
    const name = data.get("name")?.toString();
    const color = data.get("color")?.toString();

    if (!id) return fail(400, { error: "ID is required" });

    const updates: { name?: string; color?: string } = {};
    if (name) updates.name = name;
    if (color) updates.color = color;

    try {
      await apiPut(`/tags/${id}`, updates, session.access_token, { fetch });
      return { success: true };
    } catch (e) {
      console.error("Failed to update tag", e);
      return fail(500, { error: "タグの更新に失敗しました" });
    }
  },

  deleteTag: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const id = data.get("id")?.toString();

    if (!id) return fail(400, { error: "ID is required" });

    try {
      await apiDelete(`/tags/${id}`, session.access_token, { fetch });
      return { success: true };
    } catch (e) {
      console.error("Failed to delete tag", e);
      return fail(500, { error: "タグの削除に失敗しました" });
    }
  },

  addLabel: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const tagId = data.get("tagId")?.toString();
    const labelId = data.get("labelId")?.toString();

    if (!tagId || !labelId) return fail(400, { error: "Invalid data" });

    try {
      await apiPost(`/tags/${tagId}/labels/${labelId}`, {}, session.access_token, { fetch });
      return { success: true };
    } catch (e) {
      console.error("Failed to add label", e);
      return fail(500, { error: "ラベルの追加に失敗しました" });
    }
  },

  removeLabel: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const tagId = data.get("tagId")?.toString();
    const labelId = data.get("labelId")?.toString();

    if (!tagId || !labelId) return fail(400, { error: "Invalid data" });

    try {
      await apiDelete(`/tags/${tagId}/labels/${labelId}`, session.access_token, { fetch });
      return { success: true };
    } catch (e) {
      console.error("Failed to remove label", e);
      return fail(500, { error: "ラベルの削除に失敗しました" });
    }
  }
};
