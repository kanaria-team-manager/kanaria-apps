import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { supabase } from "$lib/supabase";
import type { LoginCredentials } from "./types.js";

export interface LoginResponse {
  message: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  // バックエンド経由でログイン（app_metadata.teamIdがJWTに設定される）
  const res = await fetch(`${PUBLIC_BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Login failed");
  }

  const data = await res.json();

  if (!data.session) {
    throw new Error("No session returned from server");
  }

  // バックエンドから返されたセッションをSupabaseクライアントに設定
  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  if (setSessionError) {
    throw new Error(setSessionError.message);
  }

  return { message: "Login successful" };
}
