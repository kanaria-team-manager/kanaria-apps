import { PUBLIC_BACKEND_URL } from "$env/static/public";

/**
 * 認証付きAPIクライアント
 * バックエンドへのリクエストにAuthorizationヘッダーを自動付与
 */
export async function fetchWithAuth(
  endpoint: string,
  accessToken: string | undefined,
  options: RequestInit & { fetch?: typeof fetch } = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  const customFetch = options.fetch || fetch;

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  headers.set("Content-Type", "application/json");

  // Remove custom options before passing to fetch
  const { fetch: _, ...fetchOptions } = options;

  return customFetch(`${PUBLIC_BACKEND_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });
}

/**
 * GET リクエスト用ヘルパー
 */
export async function apiGet<T>(
  endpoint: string,
  accessToken: string | undefined,
  options: { fetch?: typeof fetch } = {},
): Promise<T> {
  const res = await fetchWithAuth(endpoint, accessToken, { ...options });
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
  body: unknown,
  accessToken: string | undefined,
  options: { fetch?: typeof fetch } = {},
): Promise<T> {
  const res = await fetchWithAuth(endpoint, accessToken, {
    method: "POST",
    body: JSON.stringify(body),
    fetch: options.fetch,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * PUT リクエスト用ヘルパー
 */
export async function apiPut<T>(
  endpoint: string,
  body: unknown,
  accessToken: string | undefined,
  options: { fetch?: typeof fetch } = {},
): Promise<T> {
  const res = await fetchWithAuth(endpoint, accessToken, {
    method: "PUT",
    body: JSON.stringify(body),
    fetch: options.fetch,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * DELETE リクエスト用ヘルパー
 */
export async function apiDelete(
  endpoint: string,
  accessToken: string | undefined,
  options: { fetch?: typeof fetch } = {},
): Promise<void> {
  const res = await fetchWithAuth(endpoint, accessToken, {
    method: "DELETE",
    fetch: options.fetch,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
}
