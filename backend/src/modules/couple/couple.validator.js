import { z } from "zod";

export const createCoupleSchema = z.object({
  wifePatientId: z.string().uuid(),
  husbandPatientId: z.string().uuid(),
  marriageDuration: z.number().int().optional(),
  infertilityType: z.enum(["PRIMARY", "SECONDARY"]).optional(),
  infertilityDiagnosis: z.string().optional(),
});

export const updateCoupleSchema = createCoupleSchema.partial();
