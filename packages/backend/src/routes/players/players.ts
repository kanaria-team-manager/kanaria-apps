import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ulid } from "ulid";
import { PlayerRepository } from "../../db/repositories/PlayerRepository.js";
import type { Bindings, Variables } from "../../types.js";
import { createPlayerSchema, updatePlayerSchema } from "./schema.js";

export const playersRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

playersRoute.post(
  "/",
  zValidator("json", createPlayerSchema),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const repo = new PlayerRepository(db);
    const { name } = c.req.valid("json");

    // Extract teamId from JWT claims
    const teamId = user.app_metadata?.teamId as string | undefined;

    if (!teamId) {
      return c.json({ error: "Team ID not found in user context" }, 403);
    }

    const player = await repo.create({
      id: ulid(),
      name,
      teamId,
      parentUserId: user.id,
    });

    return c.json(player, 201);
  },
);

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

playersRoute.put(
  "/:id",
  zValidator("json", updatePlayerSchema),
  async (c) => {
    const db = c.get("db");
    const repo = new PlayerRepository(db);
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const player = await repo.update(id, body);
    
    if (!player) {
      return c.json({ message: "Player not found" }, 404);
    }

    return c.json(player);
  },
);

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
