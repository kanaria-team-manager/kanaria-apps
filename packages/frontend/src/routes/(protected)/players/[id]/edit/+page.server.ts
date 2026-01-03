import { fail, redirect } from "@sveltejs/kit";
import { apiGet, apiPut } from "$lib/api/client";
import { fetchGradeTags } from "$lib/api/master";
import type { Tag } from "@kanaria/shared";
import type { Actions, PageServerLoad } from "./$types";

interface PlayerTag {
  id: string;
  name: string;
}

interface Player {
  id: string;
  lastName: string;
  firstName: string;
  nickName?: string | null;
  imageUrl?: string | null;
  tags: PlayerTag[];
}

export const load: PageServerLoad = async ({ fetch, locals, params }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    return { player: null, gradeTags: [], error: "認証が必要です" };
  }

  try {
    const [player, gradeTags] = await Promise.all([
      apiGet<Player>(`/players/${params.id}`, accessToken, { fetch }),
      fetchGradeTags(fetch, accessToken),
    ]);
    return { player, gradeTags };
  } catch (e) {
    console.error("Failed to load player edit data:", e);
    return { player: null, gradeTags: [], error: "選手情報の取得に失敗しました" };
  }
};

export const actions: Actions = {
  default: async ({ request, fetch, locals, params }) => {
    const { session } = await locals.safeGetSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return fail(401, { error: "認証が必要です", lastName: "", firstName: "", nickName: "", imageUrl: "" });
    }

    const formData = await request.formData();
    const lastName = formData.get("lastName") as string;
    const firstName = formData.get("firstName") as string;
    const nickName = formData.get("nickName") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const tagIdsJson = formData.get("tagIds") as string;

    if (!lastName?.trim() || !firstName?.trim()) {
      return fail(400, { error: "姓と名は必須です", lastName, firstName, nickName, imageUrl });
    }

    let tagIds: string[] = [];
    if (tagIdsJson) {
      try {
        tagIds = JSON.parse(tagIdsJson);
      } catch {
        // Invalid JSON, use empty array
      }
    }

    try {
      await apiPut(
        `/players/${params.id}`,
        {
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          nickName: nickName?.trim() || undefined,
          imageUrl: imageUrl?.trim() || undefined,
          tagIds,
        },
        accessToken,
        { fetch },
      );
      return redirect(303, `/players/${params.id}`);
    } catch (e) {
      console.error("Failed to update player:", e);
      return fail(500, { error: "保存に失敗しました", lastName, firstName, nickName, imageUrl });
    }
  },
};
