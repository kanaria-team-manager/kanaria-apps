import { and, asc, eq, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import type * as schema from "../schemas/index";
import { labelables } from "../schemas/labelables";
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
      .select()
      .from(tags)
      .where(or(eq(tags.teamId, teamId), eq(tags.systemFlag, true)))
      .orderBy(asc(tags.systemFlag), asc(tags.name));

    // 各タグに紐づくラベルを取得
    const tagsWithLabels = await Promise.all(
      tagsResult.map(async (tag) => {
        const tagLabels = await this.db
          .select({
            id: labels.id,
            name: labels.name,
            color: labels.color,
          })
          .from(labelables)
          .innerJoin(labels, eq(labelables.labelId, labels.id))
          .where(
            and(
              eq(labelables.labelableType, "tag"),
              eq(labelables.labelableId, tag.id),
            ),
          );
        return { ...tag, labels: tagLabels };
      }),
    );

    return tagsWithLabels;
  }

  async findGradeTags() {
    // '学年'ラベルに紐付いているタグを取得
    // labelables経由: labels(name='学年') -> labelables -> tags
    const result = await this.db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(tags)
      .innerJoin(
        labelables,
        and(
          eq(labelables.labelableId, tags.id),
          eq(labelables.labelableType, "tag"),
        ),
      )
      .innerJoin(labels, eq(labelables.labelId, labels.id))
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
    });
    return { id, ...data, systemFlag: false, labels: [] };
  }

  async update(
    id: string,
    teamId: string,
    data: { name?: string; color?: string },
  ) {
    await this.db
      .update(tags)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
      })
      .where(and(eq(tags.id, id), eq(tags.teamId, teamId)));
  }

  async delete(id: string, teamId: string) {
    await this.db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.teamId, teamId)));
  }

  // タグにラベルを追加
  async addLabel(tagId: string, labelId: string) {
    await this.db.insert(labelables).values({
      labelId,
      labelableType: "tag",
      labelableId: tagId,
    });
  }

  // タグからラベルを削除
  async removeLabel(tagId: string, labelId: string) {
    await this.db
      .delete(labelables)
      .where(
        and(
          eq(labelables.labelId, labelId),
          eq(labelables.labelableType, "tag"),
          eq(labelables.labelableId, tagId),
        ),
      );
  }
}
