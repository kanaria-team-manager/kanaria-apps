import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { UserConfig } from "@kanaria/shared";
import type * as schema from "../schema.js";
import { taggables, tags, users } from "../schema.js";

export class UserRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  // biome-ignore lint/suspicious/noExplicitAny: Transaction type is complex
  async create(user: typeof users.$inferInsert, tx?: any) {
    const executor = tx || this.db;
    await executor.insert(users).values(user);
  }

  async findBySupabaseId(supabaseUserId: string) {
    // Note: eq import needed
    // But wait, I need to import eq from drizzle-orm
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.supabaseUserId, supabaseUserId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  async findByIdWithTags(userId: string) {
    // Get user
    const userResult = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) return null;

    const user = userResult[0];

    // Get user tags
    const userTags = await this.db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(taggables)
      .innerJoin(tags, eq(tags.id, taggables.tagId))
      .where(
        and(
          eq(taggables.taggableType, "user"),
          eq(taggables.taggableId, userId),
        ),
      );

    return {
      ...user,
      tags: userTags,
    };
  }

  async updateProfile(userId: string, data: { name?: string }) {
    const [updated] = await this.db
      .update(users)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }

  async updateConfig(userId: string, config: Partial<UserConfig>) {
    // Get current config
    const [current] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!current) {
      throw new Error("User not found");
    }

    // Deep merge config
    const currentConfig = (current.config as UserConfig | null) || {};
    const mergedConfig: UserConfig = {
      display: {
        ...(currentConfig.display || {}),
        ...(config.display || {}),
      },
      notifications: {
        ...(currentConfig.notifications || {}),
        ...(config.notifications || {}),
      },
    };

    await this.db
      .update(users)
      .set({
        config: mergedConfig,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateTags(userId: string, tagIds: string[]) {
    // Delete existing user tags
    await this.db
      .delete(taggables)
      .where(
        and(
          eq(taggables.taggableType, "user"),
          eq(taggables.taggableId, userId),
        ),
      );

    // Insert new tags
    if (tagIds.length > 0) {
      await this.db.insert(taggables).values(
        tagIds.map((tagId) => ({
          tagId,
          taggableType: "user" as const,
          taggableId: userId,
        })),
      );
    }

    // Return updated tags
    const userTags = await this.db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(taggables)
      .innerJoin(tags, eq(tags.id, taggables.tagId))
      .where(
        and(
          eq(taggables.taggableType, "user"),
          eq(taggables.taggableId, userId),
        ),
      );

    return userTags;
  }

  async updateRole(userId: string, roleId: number) {
    const result = await this.db
      .update(users)
      .set({ roleId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // biome-ignore lint/suspicious/noExplicitAny: Transaction type is complex
  async updateStatus(id: string, status: number, tx?: any) {
    const executor = tx || this.db;
    await executor.update(users).set({ status }).where(eq(users.id, id));
  }

  async findAllByTeamId(teamId: string) {
    return await this.db.select().from(users).where(eq(users.teamId, teamId));
  }

  async findAllByTeamIdWithTags(teamId: string) {
    // Fetch all users with their tags using LEFT JOIN
    const usersWithTagsRaw = await this.db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userRoleId: users.roleId,
        userTeamId: users.teamId,
        userStatus: users.status,
        userCreatedAt: users.createdAt,
        userUpdatedAt: users.updatedAt,
        userSupabaseUserId: users.supabaseUserId,
        tagId: tags.id,
        tagName: tags.name,
      })
      .from(users)
      .leftJoin(
        taggables,
        and(
          eq(taggables.taggableType, "user"),
          eq(taggables.taggableId, users.id),
        ),
      )
      .leftJoin(tags, eq(tags.id, taggables.tagId))
      .where(eq(users.teamId, teamId));

    // Group users with their tags
    interface UserWithTagsResult {
      id: string;
      name: string;
      email: string;
      roleId: number;
      teamId: string;
      status: number;
      supabaseUserId: string;
      createdAt: Date;
      updatedAt: Date;
      tags: Array<{ id: string; name: string }>;
    }

    const usersMap = new Map<string, UserWithTagsResult>();
    for (const row of usersWithTagsRaw) {
      if (!usersMap.has(row.userId)) {
        usersMap.set(row.userId, {
          id: row.userId,
          name: row.userName,
          email: row.userEmail,
          roleId: row.userRoleId,
          teamId: row.userTeamId,
          status: row.userStatus,
          supabaseUserId: row.userSupabaseUserId,
          createdAt: row.userCreatedAt,
          updatedAt: row.userUpdatedAt,
          tags: [],
        });
      }
      if (row.tagId && row.tagName) {
        const user = usersMap.get(row.userId);
        if (user && !user.tags.some((t) => t.id === row.tagId)) {
          user.tags.push({ id: row.tagId, name: row.tagName });
        }
      }
    }

    return Array.from(usersMap.values());
  }

  async findAllByTeamIdWithPlayersAndTags(teamId: string) {
    const { PlayerRepository } = await import("./PlayerRepository.js");
    const { combineUsersAndPlayers } = await import("../mappers/UserMapper.js");

    // Use repositories to fetch data
    const playerRepo = new PlayerRepository(this.db);
    const [usersWithTags, playersWithTags] = await Promise.all([
      this.findAllByTeamIdWithTags(teamId),
      playerRepo.findAllByTeamIdWithTags(teamId),
    ]);

    // Use mapper to combine
    return combineUsersAndPlayers(usersWithTags, playersWithTags);
  }
}
