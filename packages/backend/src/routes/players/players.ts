import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ulid } from "ulid";
import { PlayerRepository } from "../../db/repositories/PlayerRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";
import { createPlayerSchema, updatePlayerSchema } from "./schema.js";

export const playersRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// 全てのplayersルートに認証を適用
playersRoute.use("*", authMiddleware);

import { UserRepository } from "../../db/repositories/UserRepository.js";

// Role constants
const ROLE_OWNER = 0;
const ROLE_ADMIN = 1;
// const ROLE_MEMBER = 2;

playersRoute.post("/", zValidator("json", createPlayerSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new PlayerRepository(db);
  const userRepo = new UserRepository(db);
  const { lastName, firstName, nickName, imageUrl, tagId, parentUserId } =
    c.req.valid("json");

  // Get current user details from DB to check role
  const currentUser = await userRepo.findBySupabaseId(user.id);
  if (!currentUser) {
    return c.json({ error: "User not found" }, 401);
  }

  const teamId = currentUser.teamId;

  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  // Decide parentUserId
  let targetParentId = currentUser.id;

  if (currentUser.roleId === ROLE_OWNER || currentUser.roleId === ROLE_ADMIN) {
    if (parentUserId) {
      targetParentId = parentUserId;
    }
  }

  const player = await repo.createWithTag(
    {
      id: ulid(),
      lastName,
      firstName,
      nickName,
      imageUrl,
      teamId,
      parentUserId: targetParentId,
    },
    tagId,
  );

  return c.json(player, 201);
});

playersRoute.get("/:id", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new PlayerRepository(db);
  const id = c.req.param("id");

  const player = await repo.findById(id);

  // Authorization: Check team ownership
  const teamId = user.app_metadata?.teamId as string | undefined;
  if (!player || player.teamId !== teamId) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(player);
});

playersRoute.put("/:id", zValidator("json", updatePlayerSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new PlayerRepository(db);
  const id = c.req.param("id");
  const { tagIds, ...playerData } = c.req.valid("json");

  // Authorization: Check team ownership before update
  const existingPlayer = await repo.findById(id);
  const teamId = user.app_metadata?.teamId as string | undefined;
  if (!existingPlayer || existingPlayer.teamId !== teamId) {
    return c.json({ error: "Not found" }, 404);
  }

  // Update player data if any fields provided
  if (Object.keys(playerData).length > 0) {
    const player = await repo.update(id, playerData);
    if (!player) {
      return c.json({ error: "Update failed" }, 500);
    }
  }

  // Update tags if provided
  if (tagIds !== undefined) {
    await repo.updateTags(id, tagIds);
  }

  // Fetch updated player with tags
  const updatedPlayer = await repo.findById(id);
  return c.json(updatedPlayer);
});

// List players with optional tag filter and name search
playersRoute.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new PlayerRepository(db);
  const tagIds = c.req.queries("tagIds");
  const q = c.req.query("q");

  const teamId = user.app_metadata?.teamId as string | undefined;

  if (!teamId) {
    return c.json({ error: "Team ID not found in user context" }, 403);
  }

  const players = await repo.findAll(teamId, { tagIds, q });
  return c.json(players);
});
