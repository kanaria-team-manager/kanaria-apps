import { json } from "@sveltejs/kit";
import { BACKEND_URL } from "$env/static/private";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const payload = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, { status: response.status });
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error("Login proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
