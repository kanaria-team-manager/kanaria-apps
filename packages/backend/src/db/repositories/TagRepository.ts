import { and, asc, eq, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import type * as schema from "../schemas/index";
import { labels } from "../schemas/labels";
import { tags } from "../schemas/tags";

export class TagRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll() {
    return await this.db.select().from(tags);
  }

  async findByTeamIdWithSystem(teamId: string) {
    // チームのタグとシステムタグ（systemFlag=true）を両方取得
    return await this.db
      .select()
      .from(tags)
      .where(or(eq(tags.teamId, teamId), eq(tags.systemFlag, true)))
      .orderBy(asc(tags.name));
  }

  async findByTeamIdWithSystemAndLabels(teamId: string) {
    // チームのタグとシステムタグを取得し、各タグに紐づくラベルも取得
    const tagsResult = await this.db
      .select({
        tag: tags,
        label: labels,
      })
      .from(tags)
      .leftJoin(labels, eq(labels.id, tags.labelId))
      .where(or(eq(tags.teamId, teamId), eq(tags.systemFlag, true)))
      .orderBy(asc(tags.systemFlag), asc(tags.name));

    // タグごとにラベルを単一オブジェクトとして設定
    const tagsMap = new Map();
    for (const row of tagsResult) {
      if (!tagsMap.has(row.tag.id)) {
        tagsMap.set(row.tag.id, {
          ...row.tag,
          label: row.label || null, // 単一ラベルまたはnull
        });
      }
    }

    return Array.from(tagsMap.values());
  }

  async findGradeTags() {
    // '学年'ラベルに紐付いているタグを取得
    // tags.labelId経由: tags -> labels(name='学年')
    const result = await this.db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(tags)
      .innerJoin(labels, eq(labels.id, tags.labelId))
      .where(eq(labels.name, "学年"))
      .orderBy(asc(tags.name));

    return result;
  }

  async create(data: { teamId: string; name: string; color: string }) {
    const id = ulid();
    await this.db.insert(tags).values({
      id,
      teamId: data.teamId,
      name: data.name,
      color: data.color,
      systemFlag: false,
      labelId: null,
    });
    return { id, ...data, systemFlag: false, label: null };
  }

  async update(
    id: string,
    teamId: string,
    data: { name?: string; color?: string },
  ) {
    const result = await this.db
      .update(tags)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
      })
      .where(and(eq(tags.id, id), eq(tags.teamId, teamId)))
      .returning();

    return result[0];
  }

  async delete(id: string, teamId: string) {
    await this.db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.teamId, teamId)));
  }

  async addLabel(tagId: string, labelId: string) {
    await this.db.update(tags).set({ labelId }).where(eq(tags.id, tagId));
  }

  async removeLabel(tagId: string, labelId: string) {
    // Only remove if the labelId matches
    await this.db
      .update(tags)
      .set({ labelId: null })
      .where(and(eq(tags.id, tagId), eq(tags.labelId, labelId)));
  }
}
