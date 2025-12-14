import { z } from "zod";

export const createPlayerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // teamId is derived from context
  // parentUserId is derived from context (or optional if admin creates for others? Assuming current user is parent for now or we get it from context)
  // Requirement said "TeamID ... from user context".
  // ParentUserId usually is the creator.
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1).optional(),
});
