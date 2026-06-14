import { redirect, fail } from "@sveltejs/kit";
import { apiGet, apiPost } from "$lib/server/api/client";
import { fetchLabels, fetchGradeTags, fetchAttendanceStatuses } from "$lib/server/api/master";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const accessToken = session.access_token;

  try {
    const [labels, tags, attendanceStatuses, places] = await Promise.all([
      fetchLabels(fetch, accessToken, "event"),
      fetchGradeTags(fetch, accessToken),
      fetchAttendanceStatuses(fetch, accessToken),
      apiGet<any[]>("/places", accessToken, { fetch }),
    ]);

    return { session, labels, tags, attendanceStatuses, places };
  } catch (error) {
    console.error("Failed to load create event master data:", error);
    return { session, labels: [], tags: [], attendanceStatuses: [], places: [], error: "データの取得に失敗しました" };
  }
};

export const actions: Actions = {
  createEvent: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const payloadStr = data.get("payload")?.toString();

    if (!payloadStr) return fail(400, { error: "Invalid data" });

    try {
      const payload = JSON.parse(payloadStr);
      await apiPost("/events", payload, session.access_token, { fetch });
      return { success: true };
    } catch (e) {
      console.error("Failed to create event", e);
      return fail(500, { error: "イベントの作成に失敗しました" });
    }
  }
};
