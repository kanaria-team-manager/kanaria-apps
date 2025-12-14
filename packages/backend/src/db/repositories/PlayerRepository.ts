import { and, eq, ilike } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schemas/index.js";

type NewPlayer = typeof schema.players.$inferInsert;

export class PlayerRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async create(player: NewPlayer) {
    const result = await this.db
      .insert(schema.players)
      .values(player)
      .returning();
    return result[0];
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, id));
    return result[0];
  }

  async findAll(teamId: string, options?: { tag?: string; name?: string }) {
    let query = this.db
      .select({
        id: schema.players.id,
        name: schema.players.name,
        teamId: schema.players.teamId,
        parentUserId: schema.players.parentUserId,
        createdAt: schema.players.createdAt,
        updatedAt: schema.players.updatedAt,
      })
      .from(schema.players)
      .where(eq(schema.players.teamId, teamId))
      .$dynamic();

    if (options?.tag) {
      query = query
        .innerJoin(
          schema.taggables,
          and(
            eq(schema.taggables.taggableId, schema.players.id),
            eq(schema.taggables.taggableType, "player"),
          ),
        )
        .innerJoin(
          schema.tags,
          and(
            eq(schema.tags.id, schema.taggables.tagId),
            eq(schema.tags.name, options.tag), // Filter by tag name
          ),
        );
    }
    
    if (options?.name) {
      query = query.where(ilike(schema.players.name, `%${options.name}%`));
    }

    return query;
  }

  async update(id: string, player: Partial<NewPlayer>) {
    const result = await this.db
      .update(schema.players)
      .set(player)
      .where(eq(schema.players.id, id))
      .returning();
    return result[0];
  }
}
