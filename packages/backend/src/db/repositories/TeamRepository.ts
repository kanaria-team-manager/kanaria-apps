import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../schema.js";
import { teams } from "../schema.js";

export class TeamRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findByCode(code: string) {
    const result = await this.db
      .select()
      .from(teams)
      .where(eq(teams.code, code))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Transaction type is complex
  async create(team: typeof teams.$inferInsert, tx?: any) {
    const executor = tx || this.db;
    await executor.insert(teams).values(team);
  }

  // biome-ignore lint/suspicious/noExplicitAny: Transaction type is complex
  async updateStatus(id: string, status: number, tx?: any) {
    const executor = tx || this.db;
    await executor.update(teams).set({ status }).where(eq(teams.id, id));
  }
}
