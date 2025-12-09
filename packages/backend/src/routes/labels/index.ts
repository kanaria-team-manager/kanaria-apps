import { Hono } from "hono";
import { LabelRepository } from "../../db/repositories/LabelRepository.js";
import type { Bindings, Variables } from "../../types.js";

export const labelsRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>();

labelsRoute.get("/", async (c) => {
  const db = c.get("db");
  const repository = new LabelRepository(db);
  const labels = await repository.findAll();
  return c.json(labels);
});
