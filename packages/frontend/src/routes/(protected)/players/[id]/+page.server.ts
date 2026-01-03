import { apiGet } from "$lib/api/client";
import type { PageServerLoad } from "./$types";

interface PlayerTag {
  id: string;
  name: string;
}

interface ParentUser {
  id: string;
  name: string | null;
}

interface Player {
  id: string;
  lastName: string;
  firstName: string;
  nickName?: string | null;
  imageUrl?: string | null;
  teamId: string;
  parentUserId: string;
  createdAt: string;
  updatedAt: string;
  tags: PlayerTag[];
  parentUser: ParentUser | null;
}

export const load: PageServerLoad = async ({ fetch, locals, params }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    return { player: null, error: "認証が必要です" };
  }

  try {
    const player = await apiGet<Player>(
      `/players/${params.id}`,
      accessToken,
      { fetch },
    );
    return { player };
  } catch (e) {
    console.error("Failed to load player:", e);
    return { player: null, error: "選手情報の取得に失敗しました" };
  }
};
