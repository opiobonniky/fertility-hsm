import { z } from "zod";

export const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  physicianId: z.string().uuid().optional(),
  service: z.string().min(1, "Service is required"),
  clinicId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
});

export const appointmentSearchSchema = z.object({
  patientId: z.string().uuid().optional(),
  physicianId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});
