import { Hono } from "hono";
import { TagRepository } from "../../db/repositories/TagRepository.js";
import type { Bindings, Variables } from "../../types.js";

export const tagsRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>();

tagsRoute.get("/", async (c) => {
  const db = c.get("db");
  const repository = new TagRepository(db);
  const tags = await repository.findAll();
  return c.json(tags);
});
