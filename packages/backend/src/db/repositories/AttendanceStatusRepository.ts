import { and, eq, isNull, or } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schemas/index.js";
import { SYSTEM_FLAG } from "../schemas/utils.js";

type AttendanceStatus = typeof schema.attendanceStatuses.$inferSelect;

export class AttendanceStatusRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findDefault(): Promise<AttendanceStatus | undefined> {
    // デフォルトのステータス（システムフラグが立っているもの）を取得
    // 複数ある場合は最初のものを返す（通常は「未回答」などを想定）
    const results = await this.db
      .select()
      .from(schema.attendanceStatuses)
      .where(
        and(
          eq(schema.attendanceStatuses.systemFlag, SYSTEM_FLAG.SYSTEM),
          isNull(schema.attendanceStatuses.teamId),
        ),
      )
      .limit(1);

    return results[0];
  }

  async findAll(teamId: string): Promise<AttendanceStatus[]> {
    // システム共通ステータスとチーム固有ステータスを取得
    return await this.db
      .select()
      .from(schema.attendanceStatuses)
      .where(
        or(
          and(
            eq(schema.attendanceStatuses.systemFlag, SYSTEM_FLAG.SYSTEM),
            isNull(schema.attendanceStatuses.teamId),
          ),
          eq(schema.attendanceStatuses.teamId, teamId),
        ),
      );
  }
}
