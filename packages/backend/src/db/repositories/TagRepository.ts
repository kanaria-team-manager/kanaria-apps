import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../schemas/index";
import { labels } from "../schemas/labels";
import { taggables } from "../schemas/taggables";
import { tags } from "../schemas/tags";

export class TagRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll() {
    return await this.db.select().from(tags);
  }

  async findGradeTags() {
    // '学年'ラベルに紐付いているタグを取得
    // tags -> taggables -> labels(name='学年')
    const result = await this.db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(tags)
      .innerJoin(taggables, eq(tags.id, taggables.tagId))
      .innerJoin(labels, eq(taggables.taggableId, labels.id))
      .where(eq(labels.name, "学年"));

    return result;
  }
}
