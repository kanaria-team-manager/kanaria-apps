import { redirect } from "@sveltejs/kit";
import { apiGet } from "$lib/api/client";
import { fetchTags } from "$lib/api/master";
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
      user: null,
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

    return { user, currentUser, allTags: allTags as TagSimple[] };
  } catch (e) {
    console.error("Failed to load user data:", e);
    return {
      user: null,
      currentUser: null,
      allTags: [],
      error: "ユーザー情報の取得に失敗しました",
    };
  }
};
