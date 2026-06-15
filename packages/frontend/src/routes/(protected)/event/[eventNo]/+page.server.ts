import { apiGet, apiPut } from "$lib/server/api/client";
import { redirect, fail } from "@sveltejs/kit";
import { fetchAttendanceStatuses } from "$lib/server/api/master";
import type { AttendanceStatus } from "$lib/server/api/types";
import type { PageServerLoad } from "./$types";

interface CurrentUser {
  id: string;
  roleId: number;
}

export const load: PageServerLoad = async ({ fetch, locals, params }) => {
  const { session } = await locals.safeGetSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    return { event: null, currentUser: null, attendanceStatuses: [], error: "認証が必要です" };
  }

  try {
    const [event, currentUser, attendanceStatuses] = await Promise.all([
      apiGet(`/events/${params.eventNo}`, accessToken, { fetch }),
      apiGet<CurrentUser>("/users/me", accessToken, { fetch }),
      fetchAttendanceStatuses(fetch, accessToken),
    ]);
    return { event, currentUser, attendanceStatuses };
  } catch (e) {
    console.error("Failed to load event:", e);
    return { event: null, currentUser: null, attendanceStatuses: [], error: "イベントの取得に失敗しました" };
  }
};

export const actions = {
  updateAttendance: async ({ request, locals, fetch }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw redirect(303, "/auth/login");

    const data = await request.formData();
    const attendanceId = data.get("attendanceId")?.toString();
    const attendanceStatusId = data.get("attendanceStatusId")?.toString();

    if (!attendanceId || !attendanceStatusId) {
      return fail(400, { error: "Invalid data" });
    }

    try {
      await apiPut(
        `/attendances/${attendanceId}`,
        { attendanceStatusId },
        session.access_token,
        { fetch }
      );
      return { success: true };
    } catch (e) {
      console.error("Failed to update status", e);
      return fail(500, { error: "ステータスの更新に失敗しました" });
    }
  }
};
