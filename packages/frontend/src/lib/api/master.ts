import { apiGet, apiDelete, apiPost } from "./client";
import type { AttendanceStatus, Label, Tag } from "./types";

export async function fetchTags(
  fetch: typeof window.fetch,
  accessToken?: string,
): Promise<Tag[]> {
  return apiGet<Tag[]>("/tags", accessToken, { fetch });
}

export async function fetchGradeTags(
  fetch: typeof window.fetch,
  accessToken?: string,
): Promise<Tag[]> {
  return apiGet<Tag[]>("/tags/grade", accessToken, { fetch });
}

export async function fetchLabels(
  fetch: typeof window.fetch,
  accessToken: string,
  type?: string,
): Promise<Label[]> {
  const endpoint = type
    ? `/labels?type=${encodeURIComponent(type)}`
    : "/labels";
  return apiGet<Label[]>(endpoint, accessToken, { fetch });
}

export async function fetchAttendanceStatuses(
  fetch: typeof window.fetch,
  accessToken?: string,
): Promise<AttendanceStatus[]> {
  return apiGet<AttendanceStatus[]>("/attendance-statuses", accessToken, {
    fetch,
  });
}
