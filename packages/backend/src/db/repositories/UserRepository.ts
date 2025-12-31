import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
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

  // biome-ignore lint/suspicious/noExplicitAny: Transaction type is complex
  async updateStatus(id: string, status: number, tx?: any) {
    const executor = tx || this.db;
    await executor.update(users).set({ status }).where(eq(users.id, id));
  }

  async findAllByTeamId(teamId: string) {
    return await this.db.select().from(users).where(eq(users.teamId, teamId));
  }
}
