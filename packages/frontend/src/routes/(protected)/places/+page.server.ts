import { fail } from "@sveltejs/kit";
import { apiGet, apiDelete } from "$lib/api/client";
import type { Actions, PageServerLoad } from "./$types";

interface Place {
  id: string;
  name: string;
  description?: string | null;
  location?: { x: number; y: number } | null;
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    return { places: [], error: "認証が必要です" };
  }

  try {
    const places = await apiGet<Place[]>("/places", accessToken, { fetch });
    return { places };
  } catch (e) {
    console.error("Failed to load places:", e);
    return { places: [], error: "場所の取得に失敗しました" };
  }
};

export const actions: Actions = {
  delete: async ({ request, fetch, locals }) => {
    const { session } = await locals.safeGetSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return fail(401, { deleteError: "認証が必要です" });
    }

    const formData = await request.formData();
    const id = formData.get("id") as string;

    if (!id) {
      return fail(400, { deleteError: "IDが必要です" });
    }

    try {
      await apiDelete(`/places/${id}`, accessToken, { fetch });
      return { deleted: id };
    } catch (e) {
      console.error("Failed to delete place:", e);
      return fail(500, { deleteError: "削除に失敗しました" });
    }
  },
};
