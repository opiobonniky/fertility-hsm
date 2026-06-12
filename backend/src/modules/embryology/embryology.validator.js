import { z } from "zod";

// ── ICSI / Daily Embryo Grading ────────────────────────────────
const embryoDayEnum = z.enum(["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"]);

export const embryologyRecordSchema = z.object({
  dayNumber: embryoDayEnum,
  embryoCount: z.number().int().min(0),
  icsiMethod: z.string().optional(),
  details: z
    .array(
      z.object({
        embryoNumber: z.number().int().min(1),
        cellCount: z.number().int().optional(),
        fragmentation: z.number().min(0).max(100).optional(),
        symmetry: z.enum(["EQUAL", "UNEQUAL"]).optional(),
        multinucleation: z.boolean().optional(),
        expansion: z.number().int().min(1).max(6).optional(),
        icm: z.enum(["A", "B", "C"]).optional(),
        te: z.enum(["A", "B", "C"]).optional(),
        pnCount: z.number().int().optional(),
        fertilizationStatus: z.enum(["2PN", "1PN", "3PN", "0PN", "DEGENERATED"]).optional(),
        compaction: z.boolean().optional(),
        grade: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

export const biopsySchema = z.object({
  embryoNumber: z.number().int(),
  biopsyDate: z.string().datetime(),
  biopsyType: z.enum(["POLAR_BODY", "BLASTOMERE", "TROPHECTODERM"]),
  cellsRemoved: z.number().int().optional(),
  labNotes: z.string().optional(),
});

export const ngsResultSchema = z.object({
  embryoNumber: z.number().int(),
  result: z.enum(["EUPLOID", "ANEUPLOID", "MOSAIC", "FAILED", "PENDING"]),
  chromosomeDetails: z
    .array(
      z.object({
        chromosome: z.string(),
        status: z.string(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});
