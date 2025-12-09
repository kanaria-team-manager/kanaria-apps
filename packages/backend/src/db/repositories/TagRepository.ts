import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../schemas/index";
import { tags } from "../schemas/tags";

export class TagRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll() {
    return await this.db.select().from(tags);
  }
}
