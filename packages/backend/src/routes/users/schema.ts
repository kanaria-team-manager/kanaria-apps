import { z } from "zod";

export const updateConfigSchema = z.object({
  display: z
    .object({
      playerSortOrder: z.enum(["grade_asc", "name_asc"]).optional(),
      calendarViewMode: z.enum(["calendar", "list"]).optional(),
      itemsPerPage: z.number().int().min(10).max(100).optional(),
      defaultListView: z.enum(["card", "list"]).optional(),
    })
    .optional(),
  notifications: z
    .object({
      eventNotification: z.boolean().optional(),
      emailFrequency: z.enum(["daily", "weekly", "none"]).optional(),
    })
    .optional(),
});

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
