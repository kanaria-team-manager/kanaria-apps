import { fail } from "@sveltejs/kit";
import { apiGet, apiPut } from "$lib/api/client";
import type { Actions, PageServerLoad } from "./$types";

interface Place {
  id: string;
  name: string;
  description?: string | null;
  location?: number[] | { x: number; y: number } | null;
}

export const load: PageServerLoad = async ({ fetch, locals, params }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    return { place: null, error: "認証が必要です" };
  }

  try {
    const place = await apiGet<Place>(`/places/${params.id}`, accessToken, { fetch });
    return { place };
  } catch (e) {
    console.error("Failed to load place:", e);
    return { place: null, error: "場所の取得に失敗しました" };
  }
};

export const actions: Actions = {
  default: async ({ request, fetch, locals, params }) => {
    const { session } = await locals.safeGetSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return fail(401, { error: "認証が必要です", name: "", description: "" });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const locationJson = formData.get("location") as string;

    if (!name?.trim()) {
      return fail(400, { error: "場所名は必須です", name, description });
    }

    let location: { x: number; y: number } | null = null;
    if (locationJson) {
      try {
        location = JSON.parse(locationJson);
      } catch {
        // Invalid JSON, ignore
      }
    }

    try {
      await apiPut(
        `/places/${params.id}`,
        { name: name.trim(), description: description?.trim() || null, location },
        accessToken,
        { fetch },
      );
      return { success: true };
    } catch (e) {
      console.error("Failed to update place:", e);
      return fail(500, { error: "更新に失敗しました", name, description });
    }
  },
};
