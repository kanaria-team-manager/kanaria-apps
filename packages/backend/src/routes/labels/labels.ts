import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { LabelRepository } from "../../db/repositories/LabelRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { SYSTEM_FLAG } from "../../db/schemas/utils.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

export const labelsRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

labelsRoute.use("*", authMiddleware);

const createLabelSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "色は#FFFFFFの形式で指定してください"),
  type: z.string().optional(),
});

const updateLabelSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

labelsRoute.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const type = c.req.query("type"); // Optional: 'event', etc.

  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser?.teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const repository = new LabelRepository(db);
  const labels = await repository.findByTeamAndType(currentUser.teamId, type);
  return c.json(labels);
});

labelsRoute.post("/", zValidator("json", createLabelSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const { name, color, type } = c.req.valid("json");

  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser?.teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const repository = new LabelRepository(db);
  const label = await repository.create({
    teamId: currentUser.teamId,
    name,
    color,
    type,
  });
  return c.json(label, 201);
});

labelsRoute.put("/:id", zValidator("json", updateLabelSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const id = c.req.param("id");
  const updates = c.req.valid("json");

  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser?.teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const repository = new LabelRepository(db);
  
  // 所有権チェック
  const label = await repository.findById(id);
  if (!label || label.teamId !== currentUser.teamId) {
    return c.json({ error: "Not found" }, 404);
  }

  // システムラベル保護
  if (label.systemFlag === SYSTEM_FLAG.SYSTEM) {
    return c.json({ error: "Cannot modify system label" }, 403);
  }

  const updated = await repository.update(id, currentUser.teamId, updates);
  return c.json(updated);
});

labelsRoute.delete("/:id", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const id = c.req.param("id");

  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser?.teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const repository = new LabelRepository(db);
  
  // 所有権チェック
  const label = await repository.findById(id);
  if (!label || label.teamId !== currentUser.teamId) {
    return c.json({ error: "Not found" }, 404);
  }

  // システムラベル保護
  if (label.systemFlag === SYSTEM_FLAG.SYSTEM) {
    return c.json({ error: "Cannot delete system label" }, 403);
  }

  await repository.delete(id, currentUser.teamId);
  return c.json({ message: "Deleted" });
});
