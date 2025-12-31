import { and, eq, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../schemas/index";
import { labels } from "../schemas/labels";
import { SYSTEM_FLAG } from "../schemas/utils";

export class LabelRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll() {
    return await this.db.select().from(labels);
  }

  /**
   * Find labels that are:
   * - System labels (systemFlag = true) OR belong to the specified team
   * - Optionally filtered by type (e.g., 'event')
   */
  async findByTeamAndType(teamId: string, type?: string) {
    const conditions = [
      or(eq(labels.systemFlag, SYSTEM_FLAG.SYSTEM), eq(labels.teamId, teamId)),
    ];

    if (type) {
      conditions.push(eq(labels.type, type));
    }

    return await this.db
      .select()
      .from(labels)
      .where(and(...conditions));
  }
}
