import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import type { UserConfig } from "@kanaria/shared";
import { DEFAULT_USER_CONFIG } from "@kanaria/shared";
import { apiGet, apiPut } from "$lib/api/client";
import type { Tag } from "$lib/api/types";

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    return { config: DEFAULT_USER_CONFIG, allTags: [], error: "認証が必要です" };
  }

  try {
    const [config, allTags] = await Promise.all([
      apiGet<UserConfig>("/users/me/settings", accessToken, { fetch }),
      apiGet<Tag[]>("/tags", accessToken, { fetch }),
    ]);
    return { config: config || DEFAULT_USER_CONFIG, allTags: allTags || [] };
  } catch (e) {
    console.error("Failed to load user config:", e);
    return {
      config: DEFAULT_USER_CONFIG,
      allTags: [],
      error: "設定の取得に失敗しました",
    };
  }
};

export const actions: Actions = {
  updateConfig: async ({ request, fetch, locals }) => {
    const { session } = await locals.safeGetSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return fail(401, { error: "認証が必要です" });
    }

    const formData = await request.formData();

    // Parse form data into config object
    const config: Partial<UserConfig> = {};

    // Events settings
    const eventsViewMode = formData.get("eventsViewMode") as string | null;
    const eventsFilterTagIds = formData.get("eventsFilterTagIds") as
      | string
      | null;

    if (eventsViewMode || eventsFilterTagIds) {
      config.events = {};
      if (eventsViewMode) {
        config.events.viewMode = eventsViewMode as "calendar" | "list";
      }
      if (eventsFilterTagIds) {
        config.events.filterTagIds = JSON.parse(eventsFilterTagIds);
      }
    }

    // Players settings
    const playersViewMode = formData.get("playersViewMode") as string | null;
    const playersItemsPerPage = formData.get("playersItemsPerPage") as
      | string
      | null;

    if (playersViewMode || playersItemsPerPage) {
      config.players = {};
      if (playersViewMode) {
        config.players.viewMode = playersViewMode as "card" | "list";
      }
      if (playersItemsPerPage) {
        config.players.itemsPerPage = Number(playersItemsPerPage) as
          | 10
          | 50
          | 100;
      }
    }

    // Notification settings
    const notifFromHour = formData.get("notifFromHour") as string | null;
    const notifToHour = formData.get("notifToHour") as string | null;

    if (notifFromHour !== null || notifToHour !== null) {
      config.notifications = { emailTimeRange: {} };
      if (notifFromHour !== null && config.notifications.emailTimeRange) {
        config.notifications.emailTimeRange.fromHour = Number(notifFromHour);
      }
      if (notifToHour !== null && config.notifications.emailTimeRange) {
        config.notifications.emailTimeRange.toHour = Number(notifToHour);
      }
    }

    try {
      await apiPut<{ success: boolean }>(
        "/users/me/settings",
        config,
        accessToken,
        { fetch },
      );
      return { success: true };
    } catch (e) {
      console.error("Failed to update config:", e);
      return fail(500, { error: "設定の保存に失敗しました" });
    }
  },
};
