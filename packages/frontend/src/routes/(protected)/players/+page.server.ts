import { fetchWithAuth, apiGet } from "$lib/api/client";
import type { PageServerLoad } from "./$types";
import type { UserConfig } from "@kanaria/shared";
import { DEFAULT_USER_CONFIG } from "@kanaria/shared";

interface Player {
  id: string;
  lastName: string;
  firstName: string;
  nickName?: string | null;
  imageUrl?: string | null;
  teamId: string;
  tags?: string[];
}

export const load: PageServerLoad = async ({ parent, url }) => {
  const { session } = await parent();

  try {
    // Get page from URL query params (for future use)
    const page = Number(url.searchParams.get("page")) || 1;
    
    const [config] = await Promise.all([
      apiGet<UserConfig>("/users/me/settings", session?.access_token),
    ]);

    const limit = config?.players?.itemsPerPage || 50;

    // Fetch players with pagination
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const response = await fetchWithAuth(`/players?${params.toString()}`, session?.access_token);

    let playersData: { data: Player[]; pagination: { page: number; limit: number; total: number; totalPages: number } } = {
      data: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    };

    if (response.ok) {
      playersData = await response.json();
    } else {
      console.error("Failed to fetch players:", response.status, response.statusText);
    }

    // Merge user config with defaults to ensure all fields are populated
    const mergedConfig: UserConfig = {
      events: {
        ...DEFAULT_USER_CONFIG.events,
        ...config?.events,
      },
      players: {
        ...DEFAULT_USER_CONFIG.players,
        ...config?.players,
      },
      notifications: {
        emailTimeRange: {
          ...DEFAULT_USER_CONFIG.notifications?.emailTimeRange,
          ...config?.notifications?.emailTimeRange,
        },
      },
    };

    return {
      players: playersData.data,
      pagination: playersData.pagination,
      config: mergedConfig,
    };
  } catch (err) {
    console.error("Failed to fetch data:", err);
    return {
      players: [] as Player[],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      config: DEFAULT_USER_CONFIG,
    };
  }
};

