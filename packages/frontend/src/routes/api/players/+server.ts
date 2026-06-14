import { json } from "@sveltejs/kit";
import { apiGet } from "$lib/server/api/client";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals, fetch }) => {
  const { session } = await locals.safeGetSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    // Forward the search parameters
    const queryString = url.searchParams.toString();
    const endpoint = `/players${queryString ? `?${queryString}` : ""}`;
    const data = await apiGet(endpoint, session.access_token, { fetch });
    return json(data);
  } catch (error) {
    console.error("Failed to fetch players in proxy:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
