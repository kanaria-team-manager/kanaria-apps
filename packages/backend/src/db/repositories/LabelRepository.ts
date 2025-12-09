import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../schemas/index";
import { labels } from "../schemas/labels";

export class LabelRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll() {
    return await this.db.select().from(labels);
  }
}
