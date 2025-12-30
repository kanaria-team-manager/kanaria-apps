import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import * as schema from "../schemas/index.js";

type NewPlace = typeof schema.places.$inferInsert;

export class PlaceRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async create(place: Omit<NewPlace, "id" | "createdAt" | "updatedAt">) {
    const id = ulid();
    const [newPlace] = await this.db
      .insert(schema.places)
      .values({
        ...place,
        id,
      })
      .returning();
    return newPlace;
  }

  async findAllByTeamId(teamId: string) {
    return await this.db
      .select()
      .from(schema.places)
      .where(eq(schema.places.teamId, teamId))
      .orderBy(schema.places.createdAt);
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.places)
      .where(eq(schema.places.id, id));
    return result[0];
  }

  async update(id: string, place: Partial<NewPlace>) {
    const [updatedPlace] = await this.db
      .update(schema.places)
      .set({
        ...place,
        updatedAt: new Date(),
      })
      .where(eq(schema.places.id, id))
      .returning();
    return updatedPlace;
  }

  async delete(id: string) {
    await this.db.delete(schema.places).where(eq(schema.places.id, id));
  }
}
