import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { PlayerRepository } from "../../db/repositories/PlayerRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";
import { updateConfigSchema } from "./schema.js";

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

// Helper to check if user is owner or admin
function isOwnerOrAdmin(roleId: number): boolean {
  return roleId === 0 || roleId === 1;
}

// Get specific user details with tags
app.get("/:id", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const userId = c.req.param("id");
  const repo = new UserRepository(db);

  const currentRoleId = user.app_metadata?.roleId as number | undefined;
  const teamId = user.app_metadata?.teamId as string | undefined;

  // Only owner/admin can view other users
  if (!isOwnerOrAdmin(currentRoleId ?? 2)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const targetUser = await repo.findByIdWithTags(userId);

  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  // Verify same team
  if (targetUser.teamId !== teamId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Get players for this user
  const playerRepo = new PlayerRepository(db);
  const players = await playerRepo.findByParentUserId(userId);

  return c.json({ ...targetUser, players });
});

// Update user role
const updateRoleSchema = z.object({
  roleId: z.number().min(0).max(2),
});

app.put("/:id/role", zValidator("json", updateRoleSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const userId = c.req.param("id");
  const { roleId } = c.req.valid("json");
  const repo = new UserRepository(db);

  const currentRoleId = user.app_metadata?.roleId as number | undefined;
  const teamId = user.app_metadata?.teamId as string | undefined;

  // Only owner/admin can update roles
  if (!isOwnerOrAdmin(currentRoleId ?? 2)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  // Get target user
  const targetUser = await repo.findByIdWithTags(userId);
  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  // Verify same team
  if (targetUser.teamId !== teamId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Cannot change owner role (roleId=0)
  if (targetUser.roleId === 0) {
    return c.json({ error: "Cannot change owner role" }, 403);
  }

  const updated = await repo.updateRole(userId, roleId);

  // Update app_metadata in Supabase to keep JWT in sync
  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseKey = c.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.auth.admin.updateUserById(targetUser.supabaseUserId, {
        app_metadata: { teamId, roleId },
      });
    } catch (error) {
      console.warn("Failed to update app_metadata for role change", error);
      // Continue even if metadata update fails
    }
  }

  return c.json(updated);
});

// Update user name
const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

app.put("/:id", zValidator("json", updateUserSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const userId = c.req.param("id");
  const { name } = c.req.valid("json");
  const repo = new UserRepository(db);

  const currentRoleId = user.app_metadata?.roleId as number | undefined;
  const teamId = user.app_metadata?.teamId as string | undefined;

  // Only owner/admin can update user names
  if (!isOwnerOrAdmin(currentRoleId ?? 2)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  // Get target user
  const targetUser = await repo.findByIdWithTags(userId);
  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  // Verify same team
  if (targetUser.teamId !== teamId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const updated = await repo.updateProfile(userId, { name });
  return c.json(updated);
});

// Update user tags
const updateUserTagsSchema = z.object({
  tagIds: z.array(z.string()),
});

app.put("/:id/tags", zValidator("json", updateUserTagsSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const userId = c.req.param("id");
  const { tagIds } = c.req.valid("json");
  const repo = new UserRepository(db);

  const currentRoleId = user.app_metadata?.roleId as number | undefined;
  const teamId = user.app_metadata?.teamId as string | undefined;

  // Only owner/admin can update user tags
  if (!isOwnerOrAdmin(currentRoleId ?? 2)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  // Get target user
  const targetUser = await repo.findByIdWithTags(userId);
  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  // Verify same team
  if (targetUser.teamId !== teamId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const updatedTags = await repo.updateTags(userId, tagIds);
  return c.json(updatedTags);
});

// Get user config
app.get("/:id/config", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const userId = c.req.param("id");
  const repo = new UserRepository(db);

  // Get current user's ID
  const currentUser = await repo.findBySupabaseId(user.id);
  if (!currentUser) {
    return c.json({ error: "Current user not found" }, 404);
  }

  // Only allow users to access their own config
  if (currentUser.id !== userId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const userWithTags = await repo.findByIdWithTags(userId);
  if (!userWithTags) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(userWithTags.config || {});
});

// Update user config
app.put("/:id/config", zValidator("json", updateConfigSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const userId = c.req.param("id");
  const config = c.req.valid("json");
  const repo = new UserRepository(db);

  // Get current user's ID
  const currentUser = await repo.findBySupabaseId(user.id);
  if (!currentUser) {
    return c.json({ error: "Current user not found" }, 404);
  }

  // Only allow users to update their own config
  if (currentUser.id !== userId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await repo.updateConfig(userId, config);

  return c.json({ success: true });
});

// Get current user settings
app.get("/me/settings", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new UserRepository(db);

  const currentUser = await repo.findBySupabaseId(user.id);
  if (!currentUser) {
    return c.json({ error: "User not found" }, 404);
  }

  const userWithTags = await repo.findByIdWithTags(currentUser.id);
  if (!userWithTags) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(userWithTags.config || {});
});

// Update current user settings
app.put("/me/settings", zValidator("json", updateConfigSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const config = c.req.valid("json");
  const repo = new UserRepository(db);

  const currentUser = await repo.findBySupabaseId(user.id);
  if (!currentUser) {
    return c.json({ error: "User not found" }, 404);
  }

  await repo.updateConfig(currentUser.id, config);

  return c.json({ success: true });
});

export default app;
