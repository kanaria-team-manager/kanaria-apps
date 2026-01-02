import { and, eq, ilike, inArray, or } from "drizzle-orm";
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

  async createWithTag(player: NewPlayer, tagId: string) {
    return await this.db.transaction(async (tx) => {
      // 1. Create Player
      const [newPlayer] = await tx
        .insert(schema.players)
        .values(player)
        .returning();

      // 2. Create Taggable
      await tx.insert(schema.taggables).values({
        tagId: tagId,
        taggableType: "player",
        taggableId: newPlayer.id,
      });

      return newPlayer;
    });
  }

  async findById(id: string) {
    // Get player with tags and parent user
    const rows = await this.db
      .select({
        player: schema.players,
        tag: schema.tags,
        parentUser: {
          id: schema.users.id,
          name: schema.users.name,
        },
      })
      .from(schema.players)
      .leftJoin(
        schema.taggables,
        and(
          eq(schema.taggables.taggableId, schema.players.id),
          eq(schema.taggables.taggableType, "player"),
        ),
      )
      .leftJoin(schema.tags, eq(schema.tags.id, schema.taggables.tagId))
      .leftJoin(schema.users, eq(schema.users.id, schema.players.parentUserId))
      .where(eq(schema.players.id, id));

    if (rows.length === 0) return null;

    // Aggregate tags
    const tags: { id: string; name: string }[] = [];
    for (const row of rows) {
      if (row.tag && !tags.find((t) => t.id === row.tag!.id)) {
        tags.push({ id: row.tag.id, name: row.tag.name });
      }
    }

    return {
      ...rows[0].player,
      tags,
      parentUser: rows[0].parentUser,
    };
  }

  async findAll(teamId: string, options?: { tagIds?: string[]; q?: string }) {
    const rows = await this.db
      .select({
        player: schema.players,
        tag: schema.tags,
      })
      .from(schema.players)
      .leftJoin(
        schema.taggables,
        and(
          eq(schema.taggables.taggableId, schema.players.id),
          eq(schema.taggables.taggableType, "player"),
        ),
      )
      .leftJoin(schema.tags, eq(schema.tags.id, schema.taggables.tagId))
      .where(
        and(
          eq(schema.players.teamId, teamId),
          options?.q
            ? or(
                ilike(schema.players.lastName, `%${options.q}%`),
                ilike(schema.players.firstName, `%${options.q}%`),
              )
            : undefined,
          options?.tagIds?.length
            ? inArray(schema.taggables.tagId, options.tagIds)
            : undefined,
        ),
      );

    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.player.id)) {
        map.set(row.player.id, { ...row.player, tags: [] });
      }
      if (row.tag) {
        map.get(row.player.id).tags.push(row.tag.name);
      }
    }

    return Array.from(map.values());
  }

  async update(id: string, player: Partial<NewPlayer>) {
    const result = await this.db
      .update(schema.players)
      .set(player)
      .where(eq(schema.players.id, id))
      .returning();
    return result[0];
  }

  async updateTags(playerId: string, tagIds: string[]) {
    // Delete existing player tags
    await this.db
      .delete(schema.taggables)
      .where(
        and(
          eq(schema.taggables.taggableType, "player"),
          eq(schema.taggables.taggableId, playerId),
        ),
      );

    // Insert new tags
    if (tagIds.length > 0) {
      await this.db.insert(schema.taggables).values(
        tagIds.map((tagId) => ({
          tagId,
          taggableType: "player" as const,
          taggableId: playerId,
        })),
      );
    }
  }
}
