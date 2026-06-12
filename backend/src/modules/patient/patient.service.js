import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

const patientSelect = {
  id: true,
  mrn: true,
  oldMrn: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  nationality: true,
  nationalId: true,
  gender: true,
  phone: true,
  email: true,
  address: true,
  city: true,
  occupation: true,
  company: true,
  hearUsFrom: true,
  branch: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

// Auto-generate MRN
const generateMrn = async () => {
  const last = await prisma.patient.findFirst({
    orderBy: { mrn: "desc" },
    select: { mrn: true },
  });
  const nextNum = last ? parseInt(last.mrn.replace("LSW", ""), 10) + 1 : 1001;
  return `LSW${nextNum}`;
};

export const searchPatients = async (filters) => {
  const where = {};
  const {
    query, mrn, nationality, city, branch, gender, phone, hearUsFrom,
    page = 1, limit = 20,
  } = filters;

  // Coerce page/limit to numbers (Express 5 getter can prevent Object.assign from persisting)
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;

  if (mrn) where.mrn = { contains: mrn, mode: "insensitive" };
  if (gender) where.gender = gender;
  if (phone) where.phone = { contains: phone };
  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
      { mrn: { contains: query, mode: "insensitive" } },
      { nationalId: { contains: query } },
    ];
  }
  if (nationality) where.nationality = nationality;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (branch) where.branch = branch;
  if (hearUsFrom) where.hearUsFrom = hearUsFrom;

  const [data, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: patientSelect,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.patient.count({ where }),
  ]);

  return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
};

/**
 * Auto-detect potential spouse/partner for a new patient registration.
 * Searches by phone, national ID, or name to find existing patients
 * who might be the partner of the patient being registered.
 */
export const detectSpouse = async (searchParams) => {
  const { phone, nationalId, firstName, lastName, gender } = searchParams;
  const where = { isActive: true };
  
  // Search for the opposite gender (wife for male patient, husband for female patient)
  if (gender) {
    where.gender = gender === "MALE" ? "FEMALE" : "MALE";
  }

  // Build search conditions
  const conditions = [];
  
  if (phone) {
    conditions.push({ phone: { contains: phone } });
  }
  if (nationalId) {
    conditions.push({ nationalId });
  }
  if (firstName || lastName) {
    if (firstName && lastName) {
      conditions.push({
        AND: [
          { firstName: { contains: firstName, mode: "insensitive" } },
          { lastName: { contains: lastName, mode: "insensitive" } },
        ],
      });
    } else if (firstName) {
      conditions.push({ firstName: { contains: firstName, mode: "insensitive" } });
    } else if (lastName) {
      conditions.push({ lastName: { contains: lastName, mode: "insensitive" } });
    }
  }

  if (conditions.length === 0) {
    return [];
  }

  where.OR = conditions;

  return prisma.patient.findMany({
    where,
    select: {
      id: true,
      mrn: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      phone: true,
      nationalId: true,
      gender: true,
    },
    take: 10,
  });
};

export const getPatientById = async (id) => {
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: {
      ...patientSelect,
      medicalHistory: { select: { obHistory: true, surgicalHistory: true, gynecologicalHistory: true, lmp: true, gravida: true, para: true, abortion: true, ectopic: true, livingChildren: true } },
      diagnoses: { select: { diagnosis: true, notes: true, diagnosedAt: true } },
      wifeInCouple: { select: { id: true, infertilityType: true, husbandPatient: { select: { id: true, firstName: true, lastName: true, mrn: true } } } },
      husbandInCouple: { select: { id: true, infertilityType: true, wifePatient: { select: { id: true, firstName: true, lastName: true, mrn: true } } } },
    },
  });
  if (!patient) throw new AppError("Patient not found", 404);
  return patient;
};

export const createPatient = async (data, userId) => {
  const mrn = await generateMrn();
  const patient = await prisma.patient.create({
    data: { ...data, mrn, createdById: userId },
    select: patientSelect,
  });
  logger.info(`Patient registered: ${patient.mrn} - ${patient.firstName} ${patient.lastName}`);
  return patient;
};

export const upsertMedicalHistory = async (patientId, data, userId) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new AppError("Patient not found", 404);

  const historyData = {};
  if (data.obHistory !== undefined) historyData.obHistory = data.obHistory;
  if (data.surgicalHistory !== undefined) historyData.surgicalHistory = data.surgicalHistory;
  if (data.gynecologicalHistory !== undefined) historyData.gynecologicalHistory = data.gynecologicalHistory;
  if (data.adolescence !== undefined) historyData.adolescence = data.adolescence;
  if (data.contraception !== undefined) historyData.contraception = data.contraception;
  if (data.lmp !== undefined) historyData.lmp = new Date(data.lmp);
  if (data.menstrualCycle !== undefined) historyData.menstrualCycle = data.menstrualCycle;
  if (data.gravida !== undefined) historyData.gravida = data.gravida;
  if (data.para !== undefined) historyData.para = data.para;
  if (data.abortion !== undefined) historyData.abortion = data.abortion;
  if (data.ectopic !== undefined) historyData.ectopic = data.ectopic;
  if (data.livingChildren !== undefined) historyData.livingChildren = data.livingChildren;

  const history = await prisma.patientMedicalHistory.upsert({
    where: { patientId },
    create: { ...historyData, patientId, createdById: userId },
    update: { ...historyData },
  });

  logger.info(`Medical history upserted for patient ${patientId}`);
  return history;
};

export const deletePatient = async (id) => {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) throw new AppError("Patient not found", 404);

  // Soft delete: mark as inactive instead of hard-deleting clinical data
  const updated = await prisma.patient.update({
    where: { id },
    data: { isActive: false },
    select: patientSelect,
  });

  logger.warn(`Patient deactivated: ${updated.mrn} - ${updated.firstName} ${updated.lastName}`);
  return updated;
};

export const updatePatient = async (id, data) => {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) throw new AppError("Patient not found", 404);
  const updated = await prisma.patient.update({
    where: { id },
    data,
    select: patientSelect,
  });
  return updated;
};
