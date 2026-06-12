import { z } from "zod";

export const createCycleSchema = z.object({
  coupleId: z.string().uuid(),
  artType: z.enum(["ICSI", "IVF", "IUI", "FET", "NATURAL"]),
  pgdType: z.enum(["PGS", "PGD", "NONE"]).optional(),
  pgdGene: z.string().optional(),
  pgdMutation: z.string().optional(),
  pgdInheritanceMode: z.string().optional(),
  pgdMarkers: z.string().optional(),
  pgdTestMethod: z.string().optional(),
  pgdFemaleDiagnosis: z.string().optional(),
  pgdMaleDiagnosis: z.string().optional(),
  stimulationProtocol: z.string().optional(),
  stimulationDrugs: z.array(z.object({ name: z.string(), dosage: z.string(), unit: z.string(), startDay: z.number().int(), endDay: z.number().int().optional() })).optional(),
  treatingPhysicianId: z.string().uuid().optional(),
  lmp: z.string().datetime().optional(),
  bmi: z.number().positive().optional(),
  cycleWarnings: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCycleSchema = createCycleSchema.partial();

export const cycleStatusSchema = z.object({
  status: z.enum(["UNDER_STIMULATION", "OPU_SCHEDULED", "OPU_COMPLETED", "ET_SCHEDULED", "ET_COMPLETED", "PREGNANCY_TEST", "PREGNANCY_CONFIRMED", "CYCLE_CANCELLED", "CYCLE_COMPLETED"]),
});

export const follicleTrackingSchema = z.object({
  dayNumber: z.number().int().min(1).max(20),
  date: z.string().datetime(),
  rightOvary: z.array(z.object({ size: z.number().positive(), count: z.number().int() })).optional(),
  leftOvary: z.array(z.object({ size: z.number().positive(), count: z.number().int() })).optional(),
  endometrium: z.string().optional(),
  notes: z.string().optional(),
});

export const opuRecordSchema = z.object({
  anaesthesiaType: z.string().optional(),
  follicleCount: z.number().int().optional(),
  oocyteCount: z.number().int().optional(),
  miiOocyteCount: z.number().int().optional(),
  operationNotes: z.string().optional(),
  complications: z.string().optional(),
  postOpPlan: z.string().optional(),
  performedById: z.string().uuid(),
});

export const semenDataSchema = z.object({
  specimenType: z.string().optional(),
  processingMethod: z.string().optional(),
  collectionDate: z.string().datetime().optional(),
  abstinenceDays: z.number().int().optional(),
  preVolume: z.number().positive().optional(),
  preConcentration: z.number().positive().optional(),
  preMotility: z.number().positive().optional(),
  preProgressiveMotility: z.number().positive().optional(),
  preMorphology: z.number().positive().optional(),
  postVolume: z.number().positive().optional(),
  postConcentration: z.number().positive().optional(),
  postMotility: z.number().positive().optional(),
  postProgressiveMotility: z.number().positive().optional(),
  postMorphology: z.number().positive().optional(),
});

export const embryologyRecordSchema = z.object({
  dayNumber: z.enum(["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"]),
  embryoCount: z.number().int(),
  icsiMethod: z.string().optional(),
  icsiPerformedById: z.string().uuid().optional(),
  details: z.array(z.object({ embryoNumber: z.number().int(), grade: z.string().optional(), fragmentation: z.string().optional(), cellCount: z.number().int().optional(), expansion: z.string().optional(), quality: z.string().optional() })).optional(),
  notes: z.string().optional(),
});

export const embryoTransferSchema = z.object({
  etDate: z.string().datetime(),
  physicianId: z.string().uuid(),
  embryologistId: z.string().uuid(),
  witnessId: z.string().uuid().optional(),
  catheterType: z.string().optional(),
  catheterBrand: z.string().optional(),
  transferredEmbryos: z.array(z.object({ embryoNumber: z.number().int(), quality: z.string(), stage: z.string() })),
  residueEmbryos: z.string().optional(),
  notes: z.string().optional(),
});

export const pregnancyTestSchema = z.object({
  bhcgLevel: z.number().positive().optional(),
  testDate: z.string().datetime(),
});

export const pregnancyOutcomeSchema = z.object({
  outcome: z.string(),
  deliveryDate: z.string().datetime().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  anomalies: z.string().optional(),
  notes: z.string().optional(),
});
