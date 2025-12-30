import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { EventRepository } from "../../db/repositories/EventRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

export const eventsRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

eventsRoute.use("*", authMiddleware);

const createEventSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  details: z.string().optional(),
  labelId: z.string().min(1, "ラベルは必須です"),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  tagIds: z.array(z.string()).default([]),
  attendances: z
    .array(
      z.object({
        playerId: z.string(),
        attendanceStatusId: z.string(),
      }),
    )
    .default([]),
});

eventsRoute.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser?.teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const startDateStr = c.req.query("startDate");
  const endDateStr = c.req.query("endDate");

  if (!startDateStr || !endDateStr) {
    return c.json({ error: "startDate and endDate are required" }, 400);
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return c.json({ error: "Invalid date format" }, 400);
  }

  const repo = new EventRepository(db);
  const events = await repo.findByMonth(currentUser.teamId, startDate, endDate);

  return c.json(events);
});

eventsRoute.get("/:eventNo", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const eventNo = c.req.param("eventNo");

  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser?.teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const repo = new EventRepository(db);
  const event = await repo.findByEventNo(currentUser.teamId, eventNo);

  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }

  return c.json(event);
});

eventsRoute.post("/", zValidator("json", createEventSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");

  // Get Team ID from user (or DB)
  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser || !currentUser.teamId) {
    return c.json({ error: "User or Team not found" }, 401);
  }

  const {
    title,
    details,
    labelId,
    startDateTime,
    endDateTime,
    tagIds,
    attendances,
  } = c.req.valid("json");

  const eventRepo = new EventRepository(db);

  try {
    const event = await eventRepo.createWithRelations(
      {
        title,
        details: details || null,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        teamId: currentUser.teamId,
      },
      labelId,
      tagIds,
      attendances,
    );

    return c.json(event, 201);
  } catch (e) {
    console.error("Failed to create event:", e);
    return c.json({ error: "Failed to create event" }, 500);
  }
});
