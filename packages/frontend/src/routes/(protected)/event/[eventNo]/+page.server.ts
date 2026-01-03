import { apiGet } from "$lib/api/client";
import { fetchAttendanceStatuses } from "$lib/api/master";
import type { AttendanceStatus } from "$lib/api/types";
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
