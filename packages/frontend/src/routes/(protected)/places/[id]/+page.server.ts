import { apiGet } from "$lib/api/client";
import type { PageServerLoad } from "./$types";

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
