import type { Context, Next } from "hono";
import type { Bindings, Variables } from "../types.js";

// Simple in-memory rate limiter
// Note: For production with multiple workers, use KV or Redis
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // Max 5 requests per window

export const rateLimitMiddleware = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) => {
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For") ||
    "unknown";
  const key = `rate-limit:${ip}`;
  const now = Date.now();

  const record = store.get(key);

  if (record && now < record.resetAt) {
    // Within window
    if (record.count >= MAX_REQUESTS) {
      return c.json(
        { error: "Too many requests. Please try again later." },
        429,
      );
    }
    record.count++;
  } else {
    // New window
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of store.entries()) {
      if (now >= v.resetAt) {
        store.delete(k);
      }
    }
  }

  await next();
};
