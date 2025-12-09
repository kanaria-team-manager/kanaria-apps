import type { MiddlewareHandler } from "hono";
import { createDb } from "../db/index.js";

export const dbMiddleware: MiddlewareHandler = async (c, next) => {
  const db = createDb(c.env.DATABASE_URL);
  c.set("db", db);
  await next();
};
