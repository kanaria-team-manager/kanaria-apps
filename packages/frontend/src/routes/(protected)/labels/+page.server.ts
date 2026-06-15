import { redirect, fail } from "@sveltejs/kit";
import { apiGet, apiPost, apiPut, apiDelete } from "$lib/server/api/client";
import type { Actions, PageServerLoad } from "./$types";
import type { Label } from "@kanaria/shared";

export const load: PageServerLoad = async ({ parent, fetch }) => {
  const { session } = await parent();

  if (!session) {
    throw redirect(303, "/auth/login");
  }

  const accessToken = session.access_token;

  try {
    const labels = await apiGet<Label[]>("/labels", accessToken, { fetch });
    return { session, labels };
  } catch (error) {
    console.error("Failed to load labels data:", error);
    return { session, labels: [], error: "データの取得に失敗しました" };
  }
};

export const actions: Actions = {
  addLabel: async ({ locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    try {
      await apiPost(
        "/labels",
        { name: "新規ラベル", color: "#6366f1", type: "event" },
        session.access_token,
        { fetch }
      );
      return { success: true };
    } catch (e) {
      console.error("Failed to add label", e);
      return fail(500, { error: "ラベルの作成に失敗しました" });
    }
  },

  updateLabel: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const id = data.get("id")?.toString();
    const name = data.get("name")?.toString();
    const color = data.get("color")?.toString();
    const type = data.get("type")?.toString();

    if (!id || !name) return fail(400, { error: "ID and name are required" });

    try {
      await apiPut(
        `/labels/${id}`,
        { name: name.trim(), color, type },
        session.access_token,
        { fetch }
      );
      return { success: true };
    } catch (e) {
      console.error("Failed to update label", e);
      return fail(500, { error: "ラベルの更新に失敗しました" });
    }
  },

  deleteLabel: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const id = data.get("id")?.toString();

    if (!id) return fail(400, { error: "ID is required" });

    try {
      await apiDelete(`/labels/${id}`, session.access_token, { fetch });
      return { success: true };
    } catch (e) {
      console.error("Failed to delete label", e);
      return fail(500, { error: "ラベルの削除に失敗しました" });
    }
  }
};
