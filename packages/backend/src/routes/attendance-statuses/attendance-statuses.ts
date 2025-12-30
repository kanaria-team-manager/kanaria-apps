import { Hono } from "hono";
import { AttendanceStatusRepository } from "../../db/repositories/AttendanceStatusRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

export const attendanceStatusesRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

attendanceStatusesRoute.use("*", authMiddleware);

attendanceStatusesRoute.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");

  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser || !currentUser.teamId) {
    return c.json({ error: "User or Team not found" }, 401);
  }

  const statusRepo = new AttendanceStatusRepository(db);
  const statuses = await statusRepo.findAll(currentUser.teamId);

  return c.json(statuses);
});
