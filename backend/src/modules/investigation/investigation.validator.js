import { z } from "zod";

export const investigationSchema = z.object({
  patientId: z.string().uuid(),
  type: z.enum(["SEMEN_ANALYSIS", "HORMONAL", "INFECTION_SCREENING", "GENETIC", "LAPAROSCOPY", "HSG", "ULTRASOUND", "OTHER"]),
  date: z.string().datetime(),
  orderedById: z.string().uuid(),
  results: z.any().optional(),
  notes: z.string().optional(),
  isAbnormal: z.boolean().optional(),
});
