import { json } from "@sveltejs/kit";
import { BACKEND_URL } from "$env/static/private";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, fetch }) => {
  try {
    const { code } = params;
    const response = await fetch(`${BACKEND_URL}/teams/verify/${encodeURIComponent(code)}`);

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, { status: response.status });
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error("Team verify proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
