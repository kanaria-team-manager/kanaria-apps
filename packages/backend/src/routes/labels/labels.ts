import { Hono } from "hono";
import { LabelRepository } from "../../db/repositories/LabelRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

export const labelsRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

labelsRoute.use("*", authMiddleware);

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
