import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ulid } from "ulid";
import { PlayerRepository } from "../../db/repositories/PlayerRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";
import { createPlayerSchema, updatePlayerSchema, listPlayersQuerySchema } from "./schema.js";

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

  // Get roleId and teamId from app_metadata
  const roleId = user.app_metadata?.roleId as number | undefined;
  const teamId = user.app_metadata?.teamId as string | undefined;

  if (!teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  // Get current user ID from DB
  const currentUser = await userRepo.findBySupabaseId(user.id);
  if (!currentUser) {
    return c.json({ error: "User not found" }, 401);
  }

  // Decide parentUserId based on role from app_metadata
  let targetParentId = currentUser.id;

  if (roleId === ROLE_OWNER || roleId === ROLE_ADMIN) {
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

// List players with pagination, optional tag filter and name search
playersRoute.get("/", zValidator("query", listPlayersQuerySchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new PlayerRepository(db);
  const { page, limit, tagIds, q } = c.req.valid("query");

  const teamId = user.app_metadata?.teamId as string | undefined;

  if (!teamId) {
    return c.json({ error: "Team ID not found in user context" }, 403);
  }

  const result = await repo.findAllWithPagination(teamId, {
    page,
    limit,
    tagIds,
    q,
  });

  return c.json(result);
});
