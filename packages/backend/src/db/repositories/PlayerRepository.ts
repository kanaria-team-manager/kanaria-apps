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
      if (row.tag && !tags.find((t) => t.id === row.tag?.id)) {
        tags.push({ id: row.tag.id, name: row.tag.name });
      }
    }

    return {
      ...rows[0].player,
      tags,
      parentUser: rows[0].parentUser,
    };
  }

  async findByParentUserId(parentUserId: string) {
    // Get all players for a parent user with tags
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
      .where(eq(schema.players.parentUserId, parentUserId));

    // Group by player
    const playersMap = new Map<
      string,
      {
        id: string;
        lastName: string;
        firstName: string;
        nickName: string | null;
        tags: { id: string; name: string }[];
      }
    >();

    for (const row of rows) {
      if (!playersMap.has(row.player.id)) {
        playersMap.set(row.player.id, {
          id: row.player.id,
          lastName: row.player.lastName,
          firstName: row.player.firstName,
          nickName: row.player.nickName,
          tags: [],
        });
      }

      if (row.tag) {
        const player = playersMap.get(row.player.id);
        if (player && !player.tags.find((t) => t.id === row.tag?.id)) {
          player.tags.push({ id: row.tag.id, name: row.tag.name });
        }
      }
    }

    return Array.from(playersMap.values());
  }

  async findAll(teamId: string, options?: { tagIds?: string[]; q?: string }) {
    // Sanitize search query to prevent wildcard abuse
    const sanitizedQ = options?.q?.replace(/[%_]/g, "\\$&");

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
          sanitizedQ
            ? or(
                ilike(schema.players.lastName, `%${sanitizedQ}%`),
                ilike(schema.players.firstName, `%${sanitizedQ}%`),
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

  async findAllByTeamIdWithTags(teamId: string) {
    // Fetch all players with their tags using LEFT JOIN
    const playersWithTagsRaw = await this.db
      .select({
        playerId: schema.players.id,
        playerParentUserId: schema.players.parentUserId,
        playerLastName: schema.players.lastName,
        playerFirstName: schema.players.firstName,
        playerNickName: schema.players.nickName,
        playerImageUrl: schema.players.imageUrl,
        playerTeamId: schema.players.teamId,
        playerCreatedAt: schema.players.createdAt,
        playerUpdatedAt: schema.players.updatedAt,
        tagId: schema.tags.id,
        tagName: schema.tags.name,
      })
      .from(schema.players)
      .leftJoin(
        schema.taggables,
        and(
          eq(schema.taggables.taggableType, "player"),
          eq(schema.taggables.taggableId, schema.players.id),
        ),
      )
      .leftJoin(schema.tags, eq(schema.tags.id, schema.taggables.tagId))
      .where(eq(schema.players.teamId, teamId));

    // Group players with their tags
    interface PlayerWithTagsResult {
      id: string;
      parentUserId: string;
      lastName: string;
      firstName: string;
      nickName: string | null;
      imageUrl: string | null;
      teamId: string;
      createdAt: Date;
      updatedAt: Date;
      tags: Array<{ id: string; name: string }>;
    }

    const playersMap = new Map<string, PlayerWithTagsResult>();
    for (const row of playersWithTagsRaw) {
      if (!playersMap.has(row.playerId)) {
        playersMap.set(row.playerId, {
          id: row.playerId,
          parentUserId: row.playerParentUserId,
          lastName: row.playerLastName,
          firstName: row.playerFirstName,
          nickName: row.playerNickName,
          imageUrl: row.playerImageUrl,
          teamId: row.playerTeamId,
          createdAt: row.playerCreatedAt,
          updatedAt: row.playerUpdatedAt,
          tags: [],
        });
      }
      if (row.tagId && row.tagName) {
        const player = playersMap.get(row.playerId);
        if (player && !player.tags.some((t) => t.id === row.tagId)) {
          player.tags.push({ id: row.tagId, name: row.tagName });
        }
      }
    }

    return Array.from(playersMap.values());
  }
}
