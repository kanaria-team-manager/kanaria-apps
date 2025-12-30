import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../schema.js";
import { users } from "../schema.js";

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

  // biome-ignore lint/suspicious/noExplicitAny: Transaction type is complex
  async updateStatus(id: string, status: number, tx?: any) {
    const executor = tx || this.db;
    await executor.update(users).set({ status }).where(eq(users.id, id));
  }

  async findAllByTeamId(teamId: string) {
    return await this.db.select().from(users).where(eq(users.teamId, teamId));
  }
}
