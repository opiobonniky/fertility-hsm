import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

// ── Embryology Records (Daily Grading D0-D7) ───────────────────
export const getEmbryologyRecords = (cycleId) =>
  prisma.embryologyRecord.findMany({
    where: { cycleId },
    include: { icsiPerformedBy: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { dayNumber: "asc" },
  });

export const createEmbryologyRecord = async (cycleId, data, userId) => {
  const existing = await prisma.embryologyRecord.findFirst({
    where: { cycleId, dayNumber: data.dayNumber },
  });
  if (existing) {
    throw new AppError(`Record already exists for day ${data.dayNumber}`, 409);
  }
  const record = await prisma.embryologyRecord.create({
    data: {
      cycleId,
      dayNumber: data.dayNumber,
      embryoCount: data.embryoCount,
      icsiMethod: data.icsiMethod,
      details: data.details ?? undefined,
      notes: data.notes,
      icsiPerformedById: data.icsiPerformedById ?? undefined,
      createdById: userId,
    },
  });
  logger.info(`Embryology record created for cycle ${cycleId}, day ${data.dayNumber}`);
  return record;
};

export const updateEmbryologyRecord = async (id, data, userId) => {
  const record = await prisma.embryologyRecord.findUnique({ where: { id } });
  if (!record) throw new AppError("Embryology record not found", 404);

  const updated = await prisma.embryologyRecord.update({
    where: { id },
    data: {
      embryoCount: data.embryoCount,
      icsiMethod: data.icsiMethod,
      details: data.details ?? undefined,
      notes: data.notes,
      icsiPerformedById: data.icsiPerformedById ?? undefined,
    },
  });
  logger.info(`Embryology record ${id} updated for cycle ${record.cycleId}`);
  return updated;
};

// ── Biopsy ──────────────────────────────────────────────────────
export const getBiopsies = (cycleId) =>
  prisma.embryoBiopsy.findMany({
    where: { cycleId },
    include: { ngsReport: true },
    orderBy: { createdAt: "asc" },
  });

export const createBiopsy = async (cycleId, data, userId) => {
  const biopsy = await prisma.embryoBiopsy.create({
    data: { ...data, cycleId, performedById: userId },
  });
  logger.info(`Biopsy created for cycle ${cycleId}, embryo #${data.embryoNumber}`);
  return biopsy;
};

// ── NGS Results ─────────────────────────────────────────────────
export const getNGSResults = (cycleId) =>
  prisma.nGSReport.findMany({
    where: { embryoBiopsy: { cycleId } },
    include: { embryoBiopsy: true },
    orderBy: { createdAt: "desc" },
  });

export const createNGSResult = async (biopsyId, data, userId) => {
  const biopsy = await prisma.embryoBiopsy.findUnique({ where: { id: biopsyId } });
  if (!biopsy) throw new AppError("Biopsy not found", 404);

  const report = await prisma.nGSReport.create({
    data: { ...data, embryoBiopsyId: biopsyId, reportedById: userId },
  });
  logger.info(`NGS result recorded for biopsy ${biopsyId}`);
  return report;
};
