import { z } from "zod";

export const createPlayerSchema = z.object({
  lastName: z.string().min(1, "Last name is required"),
  firstName: z.string().min(1, "First name is required"),
  nickName: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tagId: z.string().min(1, "Grade tag is required"),
  parentUserId: z.string().optional(),
});

export const updatePlayerSchema = z.object({
  lastName: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  nickName: z.string().optional(),
  imageUrl: z.string().url().optional(),
});
