import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { TeamRepository } from "../../db/repositories/TeamRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", authMiddleware);

// Get current team settings
app.get("/settings", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const teamRepo = new TeamRepository(db);

  const teamId = user.app_metadata?.teamId as string | undefined;
  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const team = await teamRepo.findById(teamId);
  if (!team) {
    return c.json({ error: "Team not found" }, 404);
  }

  return c.json(team);
});

// Update current team settings
const updateTeamSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(500, "Name must be 500 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .nullable()
    .optional(),
});

app.put("/settings", zValidator("json", updateTeamSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const { name, description } = c.req.valid("json");
  const teamRepo = new TeamRepository(db);

  const teamId = user.app_metadata?.teamId as string | undefined;
  const currentRoleId = user.app_metadata?.roleId as number | undefined;

  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  // Only owner (0) or admin (1) can change team settings
  if (currentRoleId !== 0 && currentRoleId !== 1) {
    return c.json(
      { error: "Forbidden. Only owner or admin can update team settings." },
      403,
    );
  }

  const updated = await teamRepo.update(teamId, {
    name,
    description: description ?? null,
  });
  return c.json(updated);
});

export default app;
