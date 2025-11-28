import type { LoginCredentials } from "./types.js";

const BACKEND_URL =
  import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:8787";

export interface LoginResponse {
  message: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ログインに失敗しました: ${response.status} ${errorText}`);
  }

  return response.json();
}
