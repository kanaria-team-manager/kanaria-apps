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
  const { name, tagId, parentUserId } = c.req.valid("json");

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
      name,
      teamId,
      parentUserId: targetParentId,
    },
    tagId,
  );

  return c.json(player, 201);
});

playersRoute.get("/:id", async (c) => {
  const db = c.get("db");
  const repo = new PlayerRepository(db);
  const id = c.req.param("id");

  const player = await repo.findById(id);
  if (!player) {
    return c.json({ message: "Player not found" }, 404);
  }

  return c.json(player);
});

playersRoute.put("/:id", zValidator("json", updatePlayerSchema), async (c) => {
  const db = c.get("db");
  const repo = new PlayerRepository(db);
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const player = await repo.update(id, body);

  if (!player) {
    return c.json({ message: "Player not found" }, 404);
  }

  return c.json(player);
});

// List players with optional tag filter and name search
playersRoute.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const repo = new PlayerRepository(db);
  const tag = c.req.query("tag");
  const name = c.req.query("q") || c.req.query("name");

  const teamId = user.app_metadata?.teamId as string | undefined;

  if (!teamId) {
    return c.json({ error: "Team ID not found in user context" }, 403);
  }

  const players = await repo.findAll(teamId, { tag, name });
  return c.json(players);
});
