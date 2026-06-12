import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["FOLLOW_UP_CALL", "EMBRYO_DISPOSAL", "GAMETE_REMINDER", "EXPIRY_NOTIFICATION", "GENERAL"]).default("GENERAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  patientId: z.string().uuid().optional(),
  cycleId: z.string().uuid().optional(),
  assigneeId: z.string().uuid(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const taskCompleteSchema = z.object({
  notes: z.string().optional(),
});
