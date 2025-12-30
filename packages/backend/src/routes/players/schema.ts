import { z } from "zod";

export const createPlayerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagId: z.string().min(1, "Grade tag is required"),
  parentUserId: z.string().optional(),
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1).optional(),
});
