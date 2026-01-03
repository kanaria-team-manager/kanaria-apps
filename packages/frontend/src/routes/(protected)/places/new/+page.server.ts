import { fail, redirect } from "@sveltejs/kit";
import { apiPost } from "$lib/api/client";
import type { Actions } from "./$types";

export const actions: Actions = {
  default: async ({ request, fetch, locals }) => {
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
      await apiPost(
        "/places",
        { name: name.trim(), description: description?.trim() || null, location },
        accessToken,
        { fetch },
      );
      return redirect(303, "/places");
    } catch (e) {
      console.error("Failed to create place:", e);
      return fail(500, { error: "作成に失敗しました", name, description });
    }
  },
};
