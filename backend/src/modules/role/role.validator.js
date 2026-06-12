import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, "Role name must be at least 2 characters").max(50),
  label: z.string().trim().min(1, "Label is required").max(100),
  hierarchy: z.number().int().min(0).max(999).default(0),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  label: z.string().trim().min(1).max(100).optional(),
  hierarchy: z.number().int().min(0).max(999).optional(),
});
