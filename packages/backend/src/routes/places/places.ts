import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { PlaceRepository } from "../../db/repositories/PlaceRepository.js";
import { UserRepository } from "../../db/repositories/UserRepository.js";
import { authMiddleware } from "../../middleware/auth.js";
import type { Bindings, Variables } from "../../types.js";

export const placesRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

placesRoute.use("*", authMiddleware);

const placeSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  description: z.string().optional(),
  location: z
    .object({
      x: z.number(), // latitude or longitude (postgres point is x,y)
      y: z.number(),
    })
    .optional(),
});

placesRoute.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser?.teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const repo = new PlaceRepository(db);
  const places = await repo.findAllByTeamId(currentUser.teamId);

  return c.json(places);
});

placesRoute.get("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const repo = new PlaceRepository(db);
  const place = await repo.findById(id);

  if (!place) {
    return c.json({ error: "Place not found" }, 404);
  }
  return c.json(place);
});

placesRoute.post("/", zValidator("json", placeSchema), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const { name, description, location } = c.req.valid("json");

  const userRepo = new UserRepository(db);
  const currentUser = await userRepo.findBySupabaseId(user.id);

  if (!currentUser?.teamId) {
    return c.json({ error: "Team ID not found" }, 403);
  }

  const repo = new PlaceRepository(db);
  try {
    const newPlace = await repo.create({
      name,
      description: description || null,
      location: location ? [location.x, location.y] : null,
      teamId: currentUser.teamId,
    });
    return c.json(newPlace, 201);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Failed to create place" }, 500);
  }
});

placesRoute.put("/:id", zValidator("json", placeSchema), async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const { name, description, location } = c.req.valid("json");

  const repo = new PlaceRepository(db);
  try {
    const updatedPlace = await repo.update(id, {
      name,
      description: description || null,
      location: location ? [location.x, location.y] : undefined, // undefined or null depending on schema
    });
    return c.json(updatedPlace);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Failed to update place" }, 500);
  }
});

placesRoute.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const repo = new PlaceRepository(db);
  await repo.delete(id);
  return c.json({ message: "Deleted" });
});
