import { fetchWithAuth } from "$lib/api/client";
import type { PageServerLoad } from "./$types";

interface Player {
  id: string;
  name: string;
  teamId: string;
  tags?: string[];
}

export const load: PageServerLoad = async ({ parent }) => {
  const { session } = await parent();

  try {
    const res = await fetchWithAuth("/players", session?.access_token);

    if (!res.ok) {
      console.error("Failed to fetch players:", res.status, res.statusText);
      return { players: [] as Player[] };
    }

    const players: Player[] = await res.json();
    return { players };
  } catch (err) {
    console.error("Failed to fetch players:", err);
    return { players: [] as Player[] };
  }
};

