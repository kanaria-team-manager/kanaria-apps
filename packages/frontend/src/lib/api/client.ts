import { PUBLIC_BACKEND_URL } from "$env/static/public";

/**
 * 認証付きAPIクライアント
 * バックエンドへのリクエストにAuthorizationヘッダーを自動付与
 */
export async function fetchWithAuth(
  endpoint: string,
  accessToken: string | undefined,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  headers.set("Content-Type", "application/json");

  return fetch(`${PUBLIC_BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

/**
 * GET リクエスト用ヘルパー
 */
export async function apiGet<T>(
  endpoint: string,
  accessToken: string | undefined,
): Promise<T> {
  const res = await fetchWithAuth(endpoint, accessToken);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * POST リクエスト用ヘルパー
 */
export async function apiPost<T>(
  endpoint: string,
  accessToken: string | undefined,
  body: unknown,
): Promise<T> {
  const res = await fetchWithAuth(endpoint, accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
