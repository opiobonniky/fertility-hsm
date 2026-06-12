import { z } from "zod";

// ── Patient ─────────────────────────────────────────────────────
export const createPatientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  dateOfBirth: z.string().datetime("Invalid date"),
  nationality: z.string().trim().optional(),
  nationalId: z.string().trim().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  company: z.string().trim().optional(),
  hearUsFrom: z.string().trim().optional(),
  branch: z.string().trim().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const searchPatientSchema = z.object({
  query: z.string().optional(),
  mrn: z.string().optional(),
  nationality: z.string().optional(),
  city: z.string().optional(),
  branch: z.string().optional(),
  hearUsFrom: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  phone: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const detectSpouseSchema = z.object({
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
});

// ── Medical History ─────────────────────────────────────────────
export const medicalHistorySchema = z.object({
  obHistory: z.string().optional(),
  surgicalHistory: z.string().optional(),
  gynecologicalHistory: z.string().optional(),
  adolescence: z.string().optional(),
  contraception: z.string().optional(),
  lmp: z.string().datetime().optional(),
  menstrualCycle: z.string().optional(),
  gravida: z.number().int().optional(),
  para: z.number().int().optional(),
  abortion: z.number().int().optional(),
  ectopic: z.number().int().optional(),
  livingChildren: z.number().int().optional(),
});

export const diagnosisSchema = z.object({
  diagnosis: z.enum([
    "PCOS", "ANOVULATION", "ENDOMETRIOSIS", "TUBAL_FACTOR",
    "FIBROID", "UTERINE_FACTOR", "UNEXPLAINED", "RECURRENT_MISCARRIAGE",
    "AZOOSPERMIA", "PGS_ACGH", "PGD", "GENDER_SELECTION",
    "KLINEFELTER_SYNDROME", "MALE_FACTOR", "DOR", "OTHER",
  ]),
  notes: z.string().optional(),
});
