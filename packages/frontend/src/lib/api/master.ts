import { PUBLIC_BACKEND_URL } from "$env/static/public";
import type { AttendanceStatus, Label, Tag } from "./types";

export async function fetchTags(fetch: typeof window.fetch): Promise<Tag[]> {
  const res = await fetch(`${PUBLIC_BACKEND_URL}/tags`);
  if (!res.ok) {
    throw new Error("Failed to fetch tags");
  }
  return res.json();
}

export async function fetchGradeTags(
  fetch: typeof window.fetch,
): Promise<Tag[]> {
  const res = await fetch(`${PUBLIC_BACKEND_URL}/tags/grade`);
  if (!res.ok) {
    throw new Error("Failed to fetch grade tags");
  }
  return res.json();
}

export async function fetchLabels(
  fetch: typeof window.fetch,
): Promise<Label[]> {
  const res = await fetch(`${PUBLIC_BACKEND_URL}/labels`);
  if (!res.ok) {
    throw new Error("Failed to fetch labels");
  }
  return res.json();
}

export async function fetchAttendanceStatuses(
  fetch: typeof window.fetch,
  accessToken?: string,
): Promise<AttendanceStatus[]> {
  const headers: HeadersInit = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${PUBLIC_BACKEND_URL}/attendance-statuses`, {
    headers,
  });
  if (!res.ok) {
    throw new Error("Failed to fetch attendance statuses");
  }
  return res.json();
}
