import { eq } from "drizzle-orm";
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
}
