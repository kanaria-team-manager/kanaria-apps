import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", authMiddleware);

// Get current user with tags
app.get("/me", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new UserRepository(db);

  const currentUser = await repo.findBySupabaseId(user.id);

  if (!currentUser) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get user with tags
  const userWithTags = await repo.findByIdWithTags(currentUser.id);

  return c.json(userWithTags);
});

// Update current user profile
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

app.put("/me", zValidator("json", updateProfileSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const { name } = c.req.valid("json");

  const repo = new UserRepository(db);
  const currentUser = await repo.findBySupabaseId(user.id);

  if (!currentUser) {
    return c.json({ error: "User not found" }, 404);
  }

  const updated = await repo.updateProfile(currentUser.id, { name });
  return c.json(updated);
});

// Update current user tags
const updateTagsSchema = z.object({
  tagIds: z.array(z.string()),
});

app.put("/me/tags", zValidator("json", updateTagsSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const { tagIds } = c.req.valid("json");

  const repo = new UserRepository(db);
  const currentUser = await repo.findBySupabaseId(user.id);

  if (!currentUser) {
    return c.json({ error: "User not found" }, 404);
  }

  const updatedTags = await repo.updateTags(currentUser.id, tagIds);
  return c.json(updatedTags);
});

// Get all team users with players and tags
app.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new UserRepository(db);

  const teamId = user.app_metadata?.teamId as string | undefined;

  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const users = await repo.findAllByTeamIdWithPlayersAndTags(teamId);
  return c.json(users);
});

export default app;
