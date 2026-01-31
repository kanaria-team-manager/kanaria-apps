import { fetchLabels, fetchGradeTags } from "$lib/api/master";
import { apiGet } from "$lib/api/client";
import type { UserConfig } from "@kanaria/shared";
import { DEFAULT_USER_CONFIG } from "@kanaria/shared";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token || "";

  try {
    const [tags, labels, config] = await Promise.all([
      fetchGradeTags(fetch, accessToken),
      fetchLabels(fetch, accessToken, "event"),
      apiGet<UserConfig>("/users/me/settings", accessToken),
    ]);

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
      tags,
      labels,
      config: mergedConfig,
    };
  } catch (err) {
    console.error("Failed to fetch data:", err);
    return {
      tags: [],
      labels: [],
      config: DEFAULT_USER_CONFIG,
    };
  }
};
