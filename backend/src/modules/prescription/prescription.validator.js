import { z } from "zod";

export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  cycleId: z.string().uuid().optional(),
  medicationName: z.string().min(1, "Medication name is required"),
  medicationRoute: z.enum(["ORAL", "INJECTION", "TOPICAL", "SUBLINGUAL", "RECTAL", "INHALATION", "OTHER"]).default("ORAL"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.enum(["ONCE_DAILY", "TWICE_DAILY", "THREE_TIMES_DAILY", "FOUR_TIMES_DAILY", "EVERY_OTHER_DAY", "WEEKLY", "ONCE", "AS_DIRECTED", "OTHER"]),
  frequencyDetail: z.string().optional(),
  duration: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  refills: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  instructions: z.string().optional(),
  diagnosis: z.string().optional(),
});

export const updatePrescriptionSchema = createPrescriptionSchema.partial();

export const prescriptionStatusSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "DISCONTINUED", "CANCELLED"]),
  discontinuedReason: z.string().optional(),
});
