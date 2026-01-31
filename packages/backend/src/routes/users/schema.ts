import { z } from "zod";

export const updateConfigSchema = z.object({
  events: z
    .object({
      viewMode: z.enum(["calendar", "list"]).optional(),
      filterGrades: z.array(z.string()).optional(),
      filterLabelIds: z.array(z.string()).optional(),
    })
    .optional(),
  players: z
    .object({
      viewMode: z.enum(["card", "list"]).optional(),
      itemsPerPage: z
        .union([z.literal(10), z.literal(50), z.literal(100)])
        .optional(),
    })
    .optional(),
  notifications: z
    .object({
      emailTimeRange: z
        .object({
          fromHour: z.number().int().min(0).max(23).optional(),
          toHour: z.number().int().min(0).max(23).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
