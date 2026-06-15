import { json } from "@sveltejs/kit";
import { BACKEND_URL } from "$env/static/private";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, fetch }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const response = await fetch(`${BACKEND_URL}/teams/activate`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, { status: response.status });
    }

    const data = await response.json().catch(() => ({}));
    return json(data);
  } catch (error) {
    console.error("Team activate proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
