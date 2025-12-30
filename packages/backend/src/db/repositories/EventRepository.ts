import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulid";
import * as schema from "../schemas/index.js";

type NewEvent = typeof schema.events.$inferInsert;

export class EventRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async createWithRelations(
    eventData: Omit<
      NewEvent,
      "id" | "createdAt" | "updatedAt" | "eventNo" | "ownerId"
    >,
    ownerId: string,
    labelId: string,
    tagIds: string[],
    attendances: { playerId: string; attendanceStatusId: string }[],
  ) {
    return await this.db.transaction(async (tx) => {
      // 0. Update Team Counter and Get Code & Sequence
      const teamRows = await tx
        .update(schema.teams)
        .set({ eventSequence: sql`${schema.teams.eventSequence} + 1` })
        .where(eq(schema.teams.id, eventData.teamId))
        .returning({
          code: schema.teams.code,
          eventSequence: schema.teams.eventSequence,
        });

      if (teamRows.length === 0) {
        throw new Error("Team not found");
      }
      const { code: teamCode, eventSequence: nextSequence } = teamRows[0];

      const eventNo = `${teamCode}-${nextSequence}`;

      const eventId = ulid();

      // 1. Create Event
      const [newEvent] = await tx
        .insert(schema.events)
        .values({
          ...eventData,
          id: eventId,
          eventNo,
          ownerId,
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

  async findByEventNo(teamId: string, eventNo: string) {
    // 1. Fetch Event & Label & Owner & Place
    const eventRows = await this.db
      .select({
        event: schema.events,
        label: schema.labels,
        owner: schema.users,
        place: schema.places,
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
      .leftJoin(schema.users, eq(schema.users.id, schema.events.ownerId))
      .leftJoin(schema.places, eq(schema.places.id, schema.events.placeId))
      .where(
        and(
          eq(schema.events.teamId, teamId),
          eq(schema.events.eventNo, eventNo),
        ),
      );

    if (eventRows.length === 0) return null;
    const { event, label, owner, place } = eventRows[0];

    // 2. Fetch Tags
    const tags = await this.db
      .select({ tag: schema.tags })
      .from(schema.tags)
      .innerJoin(
        schema.taggables,
        and(
          eq(schema.taggables.tagId, schema.tags.id),
          eq(schema.taggables.taggableId, event.id),
          eq(schema.taggables.taggableType, "event"),
        ),
      );

    // 3. Fetch Attendances with Player
    const attendances = await this.db
      .select({
        attendance: schema.attendances,
        player: schema.players,
      })
      .from(schema.attendances)
      .innerJoin(
        schema.players,
        eq(schema.players.id, schema.attendances.playerId),
      )
      .where(eq(schema.attendances.eventId, event.id));

    return {
      ...event,
      label,
      owner,
      place,
      tags: tags.map((t) => t.tag),
      attendances: attendances.map((a) => ({
        ...a.attendance,
        player: a.player,
      })),
    };
  }

  async update(
    eventNo: string,
    teamId: string,
    updateData: Partial<typeof schema.events.$inferInsert>,
  ) {
    return await this.db
      .update(schema.events)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.events.teamId, teamId),
          eq(schema.events.eventNo, eventNo),
        ),
      )
      .returning();
  }
}
