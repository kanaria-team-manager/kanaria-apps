import { and, eq, gte, lt } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import * as schema from "../schemas/index.js";

type NewEvent = typeof schema.events.$inferInsert;

export class EventRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async createWithRelations(
    eventData: Omit<NewEvent, "id" | "createdAt" | "updatedAt">,
    labelId: string,
    tagIds: string[],
    attendances: { playerId: string; attendanceStatusId: string }[],
  ) {
    return await this.db.transaction(async (tx) => {
      const eventId = ulid();

      // 1. Create Event
      const [newEvent] = await tx
        .insert(schema.events)
        .values({
          ...eventData,
          id: eventId,
        })
        .returning();

      // 2. Create Labelable (Label for Event)
      await tx.insert(schema.labelables).values({
        labelId,
        labelableType: "event" as const,
        labelableId: eventId,
      });

      // 3. Create Taggables (Tags for Event)
      if (tagIds.length > 0) {
        await tx.insert(schema.taggables).values(
          tagIds.map((tagId) => ({
            tagId,
            taggableType: "event" as const,
            taggableId: eventId,
          })),
        );
      }

      // 4. Create Attendances (Initial records for players)
      if (attendances.length > 0) {
        // Create attendance records for each player
        await tx.insert(schema.attendances).values(
          attendances.map((att) => ({
            id: ulid(),
            teamId: eventData.teamId,
            eventId: eventId,
            playerId: att.playerId,
            attendanceStatusIds: [att.attendanceStatusId], // Set selected status (as array)
          })),
        );
      }

      return newEvent;
    });
  }

  async findById(id: string) {
    // Basic find (can be expanded later)
    const result = await this.db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, id));
    return result[0];
  }

  async findByMonth(teamId: string, startDate: Date, endDate: Date) {
    const rows = await this.db
      .select({
        event: schema.events,
        label: schema.labels,
        tag: schema.tags,
      })
      .from(schema.events)
      .leftJoin(
        schema.labelables,
        and(
          eq(schema.labelables.labelableId, schema.events.id),
          eq(schema.labelables.labelableType, "event"),
        ),
      )
      .leftJoin(schema.labels, eq(schema.labels.id, schema.labelables.labelId))
      .leftJoin(
        schema.taggables,
        and(
          eq(schema.taggables.taggableId, schema.events.id),
          eq(schema.taggables.taggableType, "event"),
        ),
      )
      .leftJoin(schema.tags, eq(schema.tags.id, schema.taggables.tagId))
      .where(
        and(
          eq(schema.events.teamId, teamId),
          gte(schema.events.startDateTime, startDate),
          lt(schema.events.startDateTime, endDate),
        ),
      )
      .orderBy(schema.events.startDateTime);

    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.event.id)) {
        map.set(row.event.id, {
          ...row.event,
          label: row.label,
          tags: [],
        });
      }
      if (row.tag) {
        map.get(row.event.id).tags.push(row.tag);
      }
    }

    return Array.from(map.values());
  }
}
