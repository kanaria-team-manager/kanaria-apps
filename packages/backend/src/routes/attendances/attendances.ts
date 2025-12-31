import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import * as schema from "../../db/schemas/index.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

export const attendancesRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

attendancesRoute.use("*", authMiddleware);

const updateAttendanceSchema = z.object({
  attendanceStatusId: z.string().min(1, "Status ID is required"),
});

// Update attendance status
attendancesRoute.put(
  "/:attendanceId",
  zValidator("json", updateAttendanceSchema),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { attendanceId } = c.req.param();
    const { attendanceStatusId } = c.req.valid("json");

    const userRepo = new UserRepository(db);
    const currentUser = await userRepo.findBySupabaseId(user.id);

    if (!currentUser?.teamId) {
      return c.json({ error: "Team ID not found" }, 403);
    }

    // Get the attendance and check permissions
    const [attendance] = await db
      .select({
        attendance: schema.attendances,
        player: schema.players,
      })
      .from(schema.attendances)
      .innerJoin(
        schema.players,
        eq(schema.players.id, schema.attendances.playerId),
      )
      .where(
        and(
          eq(schema.attendances.id, attendanceId),
          eq(schema.attendances.teamId, currentUser.teamId),
        ),
      );

    if (!attendance) {
      return c.json({ error: "Attendance not found" }, 404);
    }

    // Check permissions: role 0/1 can edit any, others can only edit their children
    const canEdit =
      currentUser.roleId === 0 ||
      currentUser.roleId === 1 ||
      attendance.player.parentUserId === currentUser.id;

    if (!canEdit) {
      return c.json({ error: "Permission denied" }, 403);
    }

    // Update the attendance status
    const [updated] = await db
      .update(schema.attendances)
      .set({
        attendanceStatusIds: [attendanceStatusId],
        updatedAt: new Date(),
      })
      .where(eq(schema.attendances.id, attendanceId))
      .returning();

    return c.json(updated);
  },
);
