import { redirect, fail } from "@sveltejs/kit";
import { apiGet, apiPut } from "$lib/server/api/client";
import { fetchGradeTags, fetchAttendanceStatuses } from "$lib/server/api/master";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, fetch, parent }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const accessToken = session.access_token;
  const eventNo = params.eventNo;

  try {
    const [event, currentUser, places, gradeTags, attendanceStatuses] = await Promise.all([
      apiGet<any>(`/events/${eventNo}`, accessToken, { fetch }),
      apiGet<any>('/users/me', accessToken, { fetch }),
      apiGet<any[]>('/places', accessToken, { fetch }),
      fetchGradeTags(fetch, accessToken),
      fetchAttendanceStatuses(fetch, accessToken),
    ]);

    return { session, event, currentUser, places, gradeTags, attendanceStatuses };
  } catch (error) {
    console.error("Failed to load edit event data:", error);
    throw redirect(303, `/event/${eventNo}`);
  }
};

export const actions: Actions = {
  updateEvent: async ({ params, request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const eventNo = params.eventNo;
    const data = await request.formData();
    const payloadStr = data.get("payload")?.toString();

    if (!payloadStr) return fail(400, { error: "Invalid data" });

    try {
      const payload = JSON.parse(payloadStr);
      await apiPut(`/events/${eventNo}`, payload, session.access_token, { fetch });
      return { success: true };
    } catch (e) {
      console.error("Failed to update event", e);
      return fail(500, { error: "イベントの更新に失敗しました" });
    }
  }
};
