import { z } from "zod";

export const cryoTankSchema = z.object({
  name: z.string().trim().min(1, "Tank name is required"),
  location: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  fillLevel: z.number().min(0).max(100).optional(),
});

export const embryoCryoSchema = z.object({
  cycleId: z.string().uuid(),
  embryoNumber: z.number().int(),
  freezeDate: z.string().datetime(),
  tankId: z.string().uuid(),
  partition: z.string().optional(),
  level: z.string().optional(),
  goblet: z.string().optional(),
  containerColor: z.string().optional(),
  protocol: z.string().optional(),
  media: z.string().optional(),
  strawDetails: z.string().optional(),
  renewalDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const spermCryoSchema = z.object({
  patientId: z.string().uuid(),
  freezeDate: z.string().datetime(),
  tankId: z.string().uuid(),
  partition: z.string().optional(),
  level: z.string().optional(),
  goblet: z.string().optional(),
  containerColor: z.string().optional(),
  protocol: z.string().optional(),
  source: z.string().optional(),
  count: z.number().int().optional(),
  motility: z.number().positive().optional(),
  renewalDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});
