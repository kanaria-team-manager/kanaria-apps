import { and, eq, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import type * as schema from "../schemas/index";
import { labels } from "../schemas/labels";
import { SYSTEM_FLAG } from "../schemas/utils";

export class LabelRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll() {
    return await this.db.select().from(labels);
  }

  async findById(id: string) {
    const [label] = await this.db
      .select()
      .from(labels)
      .where(eq(labels.id, id));
    return label;
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

  async create(data: {
    teamId: string;
    name: string;
    color: string;
    type?: string;
  }) {
    const id = ulid();
    const [label] = await this.db
      .insert(labels)
      .values({
        id,
        teamId: data.teamId,
        name: data.name,
        color: data.color,
        type: data.type || undefined,
        systemFlag: SYSTEM_FLAG.CUSTOM,
      })
      .returning();
    return label;
  }

  async update(
    id: string,
    teamId: string,
    data: { name?: string; color?: string },
  ) {
    const [updated] = await this.db
      .update(labels)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
      })
      .where(and(eq(labels.id, id), eq(labels.teamId, teamId)))
      .returning();
    return updated;
  }

  async delete(id: string, teamId: string) {
    await this.db
      .delete(labels)
      .where(and(eq(labels.id, id), eq(labels.teamId, teamId)));
  }
}
